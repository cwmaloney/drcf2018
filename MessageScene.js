const BitmapBuffer = require("./BitmapBuffer.js");
//const Font = require("./Font.js");
const Color = require("./Color.js");
//const colorNameToRgb = require("./config-colors.js");
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
      perMesssagePeriod = 8000,
      period = 60000,
    } = configuration;

    this.perMesssagePeriod = perMesssagePeriod;
    this.period = period;
  }

  getRequestCount() {
    return this.messageQueue.nextId;
  }
  
  getActiveMessageCount() {
    return this.messageQueue.getActiveRequests().length;
  }

  getQueuedMessageCount() {
    return this.messageQueue.getQueuedRequests().length;
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

  onTimer() {
    const nowTime = Date.now();
    if (this.startTime + this.period <= nowTime) {
      this.pause();
      return;
    }

    // if (this.getActiveMessageCount() < 1) {
    //   this.pause();
    //   return;
    // }
   
    // console.log("MessageScene onTimer");

    if (this.currentMessage) {
      if (this.currentMessage.startTime + this.perMesssagePeriod <= nowTime) {
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
    }
    if (!this.currentMessage.startTime) {
      console.log("MessageScene message: " + this.formatMessage(this.currentMessage));
      this.currentMessage.startTime = nowTime;
    }

    // redraw every time to be safe
    let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    frameBuffer.print3Lines("To:" + this.currentMessage.recipient,
                            this.currentMessage.message,
                            "From:" + this.currentMessage.sender,
                            BitmapBuffer.LITTERA_WHITE_11);
    this.gridzilla.transformScreen(frameBuffer);

    this.runningTimer = setTimeout(this.onTimer.bind(this), 1000);
  }

  //////////////////////////////////////////////////////////////////////////////
  // addMessage 
  //////////////////////////////////////////////////////////////////////////////

  addMessage(request, response) {

    let sender = request.parameters.sender;
    if (sender === undefined || sender == null) {
      console.error('grizilla::addMessage - missing sender');
      return;
    }
   
    let recipient = request.parameters.recipient;
    if (recipient === undefined || recipient == null) {
      console.error('grizilla::addMessage - missing recipient');
      return;
    }
   
    let message = request.parameters.message;
    if (message === undefined || message === null) {
      console.error('grizilla::addMessage - missing messageType');
      return;
    }
   
    let date = request.parameters.displayDate;
    let time = request.parameters.displayTime;
   
    console.log(`addMessage: From: ${sender} To: ${recipient} Message: ${message} On: ${date} At: ${time}`);

    const overUseMessage = this.messageQueue.checkOverUse(request.sessionId);
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

    const requestObject = {sender, recipient, message};
    
    try {
      const messageObject = this.messageQueue.addRequest(request.sessionId, requestObject, date, time);
   
      // let responseMessage = `*** We are currently testing messages so your message will NOT be display. Try this in a few days. Watch for your message "${message}".`
      let responseMessage = `Watch for your message "${this.formatMessage(requestObject)}"`;
      if (date != null && date != undefined && date.length > 0) {
        responseMessage += ` on ${messageObject.formattedDate}`;
      }
      if (time != null && date != undefined && time.length > 0) {
        responseMessage += ` at ${messageObject.formattedTime}`;
      }
      responseMessage += `. Your message id is ${messageObject.id}.`;
 
      return this.fillResponse(request, response, "Okay", responseMessage);
    } catch (error) {
      let message = error.toString();
      return this.fillResponse(request, response, "Error", message);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  
  formatMessage(requestObject) {
    let formattedMessage = ''

    formattedMessage = `${requestObject.recipient}, ${requestObject.message}, ${requestObject.sender}.  `;

    return formattedMessage;
  }

   // we should check the message to prevent hackers from displaying
  // "unauthoriized" messages
  
  checkMessage(message) {
    // to do
  }

  fillResponse(request, response, status, message) {
    return response.json({
      status: status,
      message: message,
      source: 'MessageScene'
    });
  }

}

module.exports = MessageScene;
