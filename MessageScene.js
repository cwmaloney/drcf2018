
//////////////////////////////////////////////////////////////////////////////
const { RequestQueue } = require("./RequestQueue.js");
const { NameManager } = require("./NameManager.js");
const { Secrets } = require("secrets.js");

const errorStatus = "Error";
const okayStatus = "Okay";

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
      this.fillResponse(request, response, errorStatus, overUseMessage);
      return; 
    }

    // check names
    let senderOkay = nameManager.isNameValid(sender);
    if (!senderOkay) {
      let message = "We do not recognize the sender name - try a common first name.";
      this.fillResponse(request, response, errorStatus, message);
      return;
    }
    let recipientOkay = nameManager.isNameValid(recipient);
    if (!recipientOkay) {
      let message = "We do not recognize the recipient name - try a common first name";
      this.fillResponse(request, response, errorStatus, message);
      return;
    }

    const message = this.formatMessage(sender, recipient, messageType);
    
    try {
      const messageObject = messageQueue.addMessage(request.sessionId, message, date, time);
   
    // let responseMessage = `*** We are currently testing Valentines so your message NOT be display. Try this in a few days. Watch for your message "${message}".`
    let responseMessage = `Watch for your message "${message}"`;
    if (date != null && date != undefined && date.length > 0) {
      responseMessage += ` on ${messageObject.formattedDate}`;
    }
    if (time != null && date != undefined && time.length > 0) {
      responseMessage += ` at ${messageObject.formattedTime}`;
    }
    responseMessage += `. Your message id is ${messageObject.id}.`;
    this.fillResponse(request, response, responseMessage);
    } catch (error) {
      let message = error.toString();
      this.fillResponse(request, response, message);
      return;
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  
  formatMessage(sender, recipient, message, date, time) {
    let formattedMessage = ''

    formattedMessage = `${recipient}, ${message} ${sender}.  `;

    return formattedMessage;
  }

  //////////////////////////////////////////////////////////////////////////////
  
  checkMessage(message) {

  }

  //////////////////////////////////////////////////////////////////////////////

  checkName(request, response) {
    let name = request.parameters.name;
    if (name === undefined || name == null) {
      console.error('grizilla::checkName - missing name');
      return;
    }

    console.log(`checkName: ${name}`);

    // check name
    let nameOkay = nameManager.isNameValid(name);

    let responseMessage = '';
    if (!nameOkay) {
      responseMessage = `We do not reconginze the name ${name}.`;
    } else {
      responseMessage = `The name ${name} is a recongized name.`;
    }

    this.fillResponse(request, response, errorStatus, responseMessage);
  }

  //////////////////////////////////////////////////////////////////////////////
 
  addName(request, response) {
    let name = request.parameters.name;
    if (name === undefined || name == null) {
      console.error('grizilla::addName - missing name');
      return;
    }

    let responseMessage;

    let nameIsKnow = nameManager.isNameValid(name);
    if (nameIsKnow) {
      responseMessage = `The name ${name} is already in the name list`;
    } else {
      let password = request.parameters.password;
      if (password === undefined || password == null) {
        console.error('grizilla::addName - missing password');
        return;
      }

      if (password !== Secrets.getSystemPassword()) {
        let message = "You must provide the correct password to add a name.";
        this.fillResponse(request, response, errorStatus, message);
        return;
      }

      console.log(`addName: ${name}`);

      nameManager.addName(name);

      responseMessage = `Name added: ${name}`;
    }

    this.fillResponse(request, response, okayStatus, responseMessage);
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
