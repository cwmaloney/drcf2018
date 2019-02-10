const BitmapBuffer = require("./BitmapBuffer.js");
const Font = require("./Font.js");
const Color = require("./Color.js");
const { colorNameToRgb } = require("./config-colors.js");
const { messages } = require("./config-messages.js");
const TimestampUtilities = require("./TimestampUtilities.js");
const HorizontalScroller = require("./HorizontalScroller.js");

const sampleMessages = [
  { sample: true, recipient: "Sheldon", message: "I love you.", sender: "Amy" },
  { sample: true, recipient: "Lucy", message: "Will you be my Valentine?", sender: "Charlie Brown" },
  { sample: true, recipient: "Penny", message: "Will you be my Valentine?", sender: "Leonard" }, 
  { sample: true, recipient: "Bernadette", message: "Will you marry me?", sender: "Howard" }
];

//////////////////////////////////////////////////////////////////////////////
const RequestQueue = require("./RequestQueue.js");

class MessageScene {

  constructor(gridzilla, facade, onPaused, nameManager, configuration, gridzillaConfiguration, facadeConfiguration) {
    this.gridzilla = gridzilla;
    this.facade = facade;
    this.onPaused = onPaused;
    this.nameManager = nameManager;

    this.configure(configuration, gridzillaConfiguration, facadeConfiguration);
  
    console.log(`loading message queue  @${new Date()} ...`);
    this.messageQueue = new RequestQueue("Message");
    this.messageQueue.loadRequests();
    console.log(`loading messages complete  @${new Date()}`);

    this.paused = true;
  }


  configure(configuration, gridzillaConfiguration, facadeConfiguration) {
    const defaults = {
      period: 60000,          // time scene should run
      perMessagePeriod: 12000 // time a message should "run"  
    };

    const defaultGridzillaConfiguration = {
      color: new Color(255, 255, 255),
      backgroundColor: new Color(0, 0, 0),

      speed: 30, // speed is ms between moves

      typeface: "Littera",
      fontSize: 11,
    };

    const defaultFacadeConfiguration = {
      color: new Color(255, 255, 255),
      backgroundColor: new Color(0, 0, 0),

      speed: 30, // speed is ms between moves

      typeface: "Littera",
      fontSize: 11,
    };

    this.configuration = Object.assign(defaults, configuration);
    this.facadeConfiguration = Object.assign(defaultFacadeConfiguration, facadeConfiguration);
    this.gridzillaConfiguration = Object.assign(defaultGridzillaConfiguration, gridzillaConfiguration);

    this.facadeConfiguration.font = new Font(this.facadeConfiguration.typeface, this.facadeConfiguration.fontSize, this.facadeConfiguration.color);
    this.gridzillaConfiguration.font = new Font(this.gridzillaConfiguration.typeface, this.gridzillaConfiguration.fontSize, this.gridzillaConfiguration.color);
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
    this.messageCountForThisPeriod = 0;
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

    // if (this.gridzillaTextScroller){
    //   this.gridzillaTextScroller.stop();
    //   this.gridzillaTextScroller = null;
    // }

    if (this.facadeTextScroller){
      this.facadeTextScroller.stop();
      this.facadeTextScroller = null;
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
        this.displayMessage();
      }
      if (this.currentMessage.startTime + this.configuration.perMessagePeriod <= nowTime) {
        if (!this.currentMessage.sample) {
          this.currentMessage.endTime = nowTime;
          this.currentMessage.processedTimestamp = TimestampUtilities.getNowTimestampNumber();
          this.messageQueue.writeRequests();
        }
        this.currentMessage = null;
      }
    }
    if (!this.currentMessage) {
      this.currentMessage = this.messageQueue.getNextRequest();
      if (this.currentMessage == null) {
        if (this.messageCountForThisPeriod === 0) {
          const index = Math.floor(Math.random()*4);
          this.currentMessage = sampleMessages[index];
        } else {
          this.pause();
          return;
        }
      }
      console.log(`MessageScene starting=${this.formatMessage(this.currentMessage)} id=${this.currentMessage.id}`);
      this.currentMessage.startTime = Date.now();
      this.displayMessage();
    }
  }

  displayMessage() {
    this.messageCountForThisPeriod++;

    const message = this.currentMessage;
    const colorsMatch = (message.color == message.backgroundColor);
    const color = this.pickColor(message.color, new Color(240, 240, 240), colorsMatch);
    const backgroundColor = this.pickColor(message.backgroundColor, new Color(0, 0, 0), colorsMatch);

    let timeRequired = 0;
    if (this.gridzilla) {
      this.displayMessageOnGridzilla(message, color, backgroundColor);
      timeRequired = Math.max(timeRequired, this.configuration.perMessagePeriod);
    }
    if (this.facade) {
      const text = "              " + message.recipient + ", " + message.message + "  " + message.sender + "     ";

      this.facadeTextScroller = this.displayMessageOnFacade(text, color, backgroundColor, this.facade, this.facadeConfiguration);
      const scrollTime = this.getScrollTime(text, this.facadeConfiguration.font, this.facade, this.facadeConfiguration)
      // for the timer required, add 2 seconds (for safety) and display message twice
      timeRequired = Math.max(timeRequired, (scrollTime + 2000)*2.5);
    }

    const timeout = Math.min(timeRequired, this.configuration.period);
    this.runningTimer = setTimeout(this.onTimer.bind(this), timeout);
  }

  displayMessageOnGridzilla(message, color, backgroundColor) {
    let frameBuffer = BitmapBuffer.fromNew(this.gridzilla.width, this.gridzilla.height, backgroundColor);

    frameBuffer.print3Lines("To:" + message.recipient,
                            message.message,
                            "From:" + message.sender,
                            new Font("Littera", 11, color));
    this.gridzilla.transformScreen(frameBuffer);
  }

  displayMessageOnFacade(text, color, backgroundColor, output, outputConfiguration) {
    const frameBuffer = BitmapBuffer.fromNew(output.width, output.height, outputConfiguration.backgroundColor);

    const scroller = new HorizontalScroller(0, outputConfiguration.scrollTextTop, frameBuffer, output);
    scroller.scrollText(text, outputConfiguration.font, outputConfiguration.speed);

    return scroller;
  }

  getScrollTime(message, font, output, outputConfiguration) {
    return HorizontalScroller.calculateImageScrollTime(message, font, output.width, outputConfiguration.speed);
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

  // check the message to prevent hackers from displaying
  // "unauthorized" messages
  checkMessage(message) {
    return messages.includes(message);
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
