
//////////////////////////////////////////////////////////////////////////////
const { RequestQueue } = require("./RequestQueue.js");
const { NameManager } = require("./NameManager.js");
//const { Secrets } = require("secrets.js");

// const "Error" = "Error";
// const okayStatus = "Okay";

const nameManager = new NameManager();
const messageQueue = new RequestQueue();

class MessageScene {

  constructor() {}

  initialize() {
    console.log(`loading names  @${new Date()} ...`);
    nameManager.loadNameLists();
    console.log(`loading names complete  @${new Date()}`);

    console.log(`loading message queue  @${new Date()} ...`);
    messageQueue.loadMessages();
    console.log(`loading messages complete  @${new Date()}`);
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
   
    let messageType = request.parameters.messageType;
    if (messageType === undefined || messageType === null) {
      console.error('grizilla::addMessage - missing messageType');
      return;
    }
   
    let date = request.parameters.displayDate;
    let time = request.parameters.displayTime;
   
    console.log(`addMessage: From: ${sender} To: ${recipient} Message: ${messageType} On: ${date} At: ${time}`);

    const overUseMessage = messageQueue.checkOverUse(request.sessionId);
    if (overUseMessage != null && overUseMessage != undefined) {
      return this.fillResponse(request, response, "Error", overUseMessage);
    }

    // check names
    let senderOkay = nameManager.isNameValid(sender);
    if (!senderOkay) {
      let message = "We do not recognize the sender name - try a common first name.";
      return this.fillResponse(request, response, "Error", message);
    }
    let recipientOkay = nameManager.isNameValid(recipient);
    if (!recipientOkay) {
      let message = "We do not recognize the recipient name - try a common first name";
      return this.fillResponse(request, response, "Error", message);
    }

    const message = this.formatMessage(sender, recipient, messageType);
    
    try {
      const messageObject = messageQueue.addMessage(request.sessionId, message, date, time);
   
      // let responseMessage = `*** We are currently testing messages so your message NOT be display. Try this in a few days. Watch for your message "${message}".`
      let responseMessage = `Watch for your message "${message}"`;
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
  // "unauthroized" messages
  
  checkMessage(message) {
    // to do
  }

  //////////////////////////////////////////////////////////////////////////////

  fillResponse(request, response, status, message) {
    return response.json({
      status: status,
      message: message,
      source: 'NameManager'
    });
  }

}

module.exports = MessageScene;
