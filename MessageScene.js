const BitmapBuffer = require("./BitmapBuffer.js");
const Font = require("./Font.js");
const Color = require("./Color.js");
const { colorNameToRgb } = require("./config-colors.js");
const TimestampUtilities = require("./TimestampUtilities.js");


//////////////////////////////////////////////////////////////////////////////
const RequestQueue = require("./RequestQueue.js");

class MessageScene {

  constructor(gridzilla, onPaused, nameManager, configuration) {
    this.gridzilla = gridzilla;
    this.onPaused = onPaused;
    this.nameManager = nameManager;

    this.configure(configuration);
  
    console.log(`loading message queue  @${new Date()} ...`);
    this.messageQueue = new RequestQueue("Message");
    this.messageQueue.loadRequests();
    console.log(`loading messages complete  @${new Date()}`);

    this.paused = true;
  }

  configure(configuration) {
    const {
      perMessagePeriod = 10000,
      period = 60000,
    } = configuration;

    this.perMessagePeriod = perMessagePeriod;
    this.period = period;
  }

  getRequestCount() {
    return this.messageQueue.nextId;
  }
  
  getActiveRequestCount() {
    return this.messageQueue.getActiveRequests().length;
  }

  getQueuedRequestCount() {
    return this.messageQueue.getQueuedRequests().length;
  }

  getMessageQueue() {
    return this.messageQueue.getRequests();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Scene control 
  //////////////////////////////////////////////////////////////////////////////
  
  run() {
    console.log("MessageScene run");
    this.paused = false;
    this.startTime = Date.now();
    this.onTimer();
  }

  pause() {
    console.log("MessageScene pause");
    clearTimeout(this.runningTimer);
    if (this.currentMessage) {
      // message did not finish so we will restart the message
      // when the scene restarts
      this.currentMessage.startTime = undefined;
    }
    this.paused = true;
    this.onPaused();
  }

  forcePause() {
    console.log("MessageScene forcePause");
    this.pause();
  }

  pickColor(color, defaultColor, colorsMatch) {
    const rgbArray = (color && !colorsMatch && colorNameToRgb[color]) ? colorNameToRgb[color] : defaultColor;
    return new Color(rgbArray);
  }

  onTimer() {
    const nowTime = Date.now();
    if (this.startTime + this.period <= nowTime) {
      this.pause();
      return;
    }
   
    // console.log("MessageScene onTimer");

    if (this.currentMessage) {
      if (!this.currentMessage.startTime) {
        console.log(`MessageScene restarting=${this.formatMessage(this.currentMessage)} id=${this.currentMessage.id}`);
        this.currentMessage.startTime = Date.now();
      }
      if (this.currentMessage.startTime + this.perMessagePeriod <= nowTime) {
        this.currentMessage.endTime = nowTime;
        this.currentMessage.processedTimestamp = TimestampUtilities.getNowTimestampNumber();
        this.messageQueue.writeRequests();
        this.currentMessage = null;
      }
    }
    if (!this.currentMessage) {
      this.currentMessage = this.messageQueue.getNextRequest();
      if (this.currentMessage == null) {
        this.pause();
        return;
      }
      console.log(`MessageScene starting=${this.formatMessage(this.currentMessage)} id=${this.currentMessage.id}`);
      this.currentMessage.startTime = Date.now();
    }

    const message = this.currentMessage;
    const colorsMatch = (message.color == message.backgroundColor);
    const color = this.pickColor(message.color, new Color(240, 240, 240), colorsMatch);
    const backgroundColor = this.pickColor(message.backgroundColor, new Color(0, 0, 0), colorsMatch);

    // redraw every time to be safe
    let frameBuffer = BitmapBuffer.fromNew(168, 36, backgroundColor);

    frameBuffer.print3Lines("To:" + message.recipient,
                            message.message,
                            "From:" + message.sender,
                            new Font("Littera", 11, color));
    this.gridzilla.transformScreen(frameBuffer);

    this.runningTimer = setTimeout(this.onTimer.bind(this), 2000);
  }

  //////////////////////////////////////////////////////////////////////////////
  // addMessage 
  //////////////////////////////////////////////////////////////////////////////

  addMessage(request, response) {

    let sender = request.body.sender;   
    let recipient = request.body.recipient;
    if (!recipient  || !sender) {
      let responseMessage = "Please enter both a to and from name.";
      return this.fillResponse(request, response, "Error", responseMessage);
    }
   
    let message = request.body.message;
    if (message === undefined || message === null) {
      let responseMessage = "Please select a message.";
      return this.fillResponse(request, response, "Error", responseMessage);
    }
   
    // thesea are optional
    const date = request.body.displayDate;
    const time = request.body.displayTime;
    const color = request.body.color;
    const backgroundColor = request.body.backgroundColor;
   
    console.log(`MessagesScene::addMessage: from:${sender} to:${recipient} m:${message} on:${date} at:${time} color:${color} bg:${backgroundColor}`);

    const overUseMessage = this.messageQueue.checkOverUse(request.body.sessionId);
    if (overUseMessage != null && overUseMessage != undefined) {
      return this.fillResponse(request, response, "Error", overUseMessage);
    }

    // check names
    let senderOkay = this.nameManager.isNameValid(sender);
    if (!senderOkay) {
      let responseMessage = "We do not recognize the sender name - try a common first name.";
      return this.fillResponse(request, response, "Error", responseMessage);
    }
    let recipientOkay = this.nameManager.isNameValid(recipient);
    if (!recipientOkay) {
      let responseMessage = "We do not recognize the recipient name - try a common first name";
      return this.fillResponse(request, response, "Error", responseMessage);
    }

    // check message
    let messageOkay = this.checkMessage(message);
    if (!messageOkay) {
      let responseMessage = "We cannot send that message.";
      return this.fillResponse(request, response, "Error", responseMessage);
    }

    const requestObject = { sessionId: request.body.sessionId, sender, recipient, message, date, time, color, backgroundColor};
    
    try {
      this.messageQueue.addRequest(requestObject);
   
      // let responseMessage = `*** We are currently testing messages so your message will NOT be display. Try this in a few days. Watch for your message "${message}".`
      let responseMessage = `Watch for your message: "${this.formatMessage(requestObject)}"`;
      if (date != null && date != undefined && date.length > 0) {
        responseMessage += ` on ${requestObject.formattedDate}`;
      }
      if (time != null && date != undefined && time.length > 0) {
        responseMessage += ` at ${requestObject.formattedTime}`;
      }
      responseMessage += `. Your message id is ${requestObject.id}.`;
 
      return this.fillResponse(request, response, "Okay", responseMessage);
    } catch (error) {
      let message = error.toString();
      return this.fillResponse(request, response, "Error", message);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  
  formatMessage(requestObject) {
    let formattedMessage = ''

    formattedMessage = `${requestObject.recipient}, ${requestObject.message}, ${requestObject.sender}`;

    return formattedMessage;
  }

   // we should check the message to prevent hackers from displaying
  // "unauthoriized" messages
  
  checkMessage(message) {
    // to do
    return true;
  }

  fillResponse(request, response, status, message) {
    return response.json({
      sessionId: request.body.sessionId,
      status: status,
      message: message,
      source: 'MessageScene'
    });
  }

}

module.exports = MessageScene;
