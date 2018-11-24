const BitmapBuffer = require("./BitmapBuffer.js");
//const Font = require("./Font.js");
const Color = require("./Color.js");
//const colorNameToRgb = require("./config-colors.js");


//////////////////////////////////////////////////////////////////////////////
const RequestQueue = require("./RequestQueue.js");

class MessageScene {

  constructor(gridzilla, onPaused, nameManager, configuration) {
    this.gridzilla = gridzilla;
    this.onPaused = onPaused;
    this.nameManager = nameManager;

    this.configure(configuration);
  
    console.log(`loading message queue  @${new Date()} ...`);
    this.messageQueue = new RequestQueue();
    this.messageQueue.loadRequests();
    console.log(`loading messages complete  @${new Date()}`);

    this.paused = true;
    this.onPaused = onPaused;
  }

  configure(configuration) {
    const {
      perMesssagePeriod = 5000,
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
    console.log("messageScene run");
    this.paused = false;
    this.startTime = Date.now();
    onTimer(this);
  }

  pause() {
    console.log("messageScene pause");
    clearTimeout(this.runningTimer);
    this.paused = true;
    this.onPaused();
  }

  forcePause() {
    console.log("messageScene forcePause");
    this.pause();
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

    const formattedMessage = this.formatMessage(sender, recipient, message);
    
    try {
      const messageObject = this.messageQueue.adddRequest(request.sessionId, {sender, recipient, message}, date, time);
   
      // let responseMessage = `*** We are currently testing messages so your message will NOT be display. Try this in a few days. Watch for your message "${message}".`
      let responseMessage = `Watch for your message "${formattedMessage}"`;
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
  
  formatMessage(sender, recipient, message, date, time) {
    let formattedMessage = ''

    formattedMessage = `${recipient}, ${message} ${sender}.  `;

    return formattedMessage;
  }

  //////////////////////////////////////////////////////////////////////////////
  // we should check the message to prevent hackers from displaying
  // "unauthoriized" messages
  
  checkMessage(message) {
    // to do
  }

  //////////////////////////////////////////////////////////////////////////////

  fillResponse(request, response, status, message) {
    return response.json({
      status: status,
      message: message,
      source: 'MessageScene'
    });
  }

}

//////////////////////////////////////////////////////////////////////////////

function onTimer(scene) {
  const nowTime = Date.now();
  if (scene.startTime + scene.period <= nowTime) {
    scene.pause();
    return;
  }

  if (scene.getActiveMessageCount() < 1) {
    scene.pause();
    return;
  }
 
  console.log("messageScene onTimer");

  const messageObject = scene.messageQueue.getNextRequest();
  if (messageObject == null) {
    scene.pause();
    return;
  }

  // redraw every time to be safe
  let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
  frameBuffer.print3Lines("To:" + messageObject.recipient, messageObject.message, "From:" + messageObject.sender, BitmapBuffer.LITTERA_WHITE_16);
  scene.gridzilla.transformScreen(frameBuffer);

  scene.runningTimer = setTimeout(onTimer, 1000, scene); 
}

module.exports = MessageScene;
