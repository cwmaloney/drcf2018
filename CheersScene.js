const BitmapBuffer = require("./BitmapBuffer.js");
//const Font = require("./Font.js");
const Color = require("./Color.js");
//const colorNameToRgb = require("./config-colors.js");
const TimestampUtilities = require("./TimestampUtilities.js");
const { teamNameToColorsMap } = require("./config-teams.js");


//////////////////////////////////////////////////////////////////////////////
const RequestQueue = require("./RequestQueue.js");

class CheerScene {

  constructor(gridzilla, onPaused, nameManager, configuration) {
    this.gridzilla = gridzilla;
    this.onPaused = onPaused;
    this.nameManager = nameManager;

    this.configure(configuration);
  
    console.log(`loading cheer queue  @${new Date()} ...`);
    this.cheerQueue = new RequestQueue("Cheer");
    this.cheerQueue.loadRequests();
    console.log(`loading cheer complete  @${new Date()}`);

    this.paused = true;
  }

  configure(configuration) {
    const {
      perCheerPeriod = 8000,
      period = 60000,
    } = configuration;

    this.perCheerPeriod = perCheerPeriod;
    this.period = period;
  }

  getRequestCount() {
    return this.cheerQueue.nextId;
  }
  
  getActiveCheerCount() {
    return this.cheerQueue.getActiveRequests().length;
  }

  getQueuedCheerCount() {
    return this.cheerQueue.getQueuedRequests().length;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Scene control 
  //////////////////////////////////////////////////////////////////////////////
  
  run() {
    console.log("CheerScene run");
    this.paused = false;
    this.startTime = Date.now();
    this.onTimer();
  }

  pause() {
    console.log("CheerScene pause");
    clearTimeout(this.runningTimer);
    if (this.currentCheer) {
      // message did not finish so we will restart the message
      // when the scene restarts
      this.currentCheer.startTime = undefined;
    }
    this.paused = true;
    this.onPaused();
  }

  forcePause() {
    console.log("CheerScene forcePause");
    this.pause();
  }

  onTimer() {
    const nowTime = Date.now();
    if (this.startTime + this.period <= nowTime) {
      this.pause();
      return;
    }
   
    // console.log("CheerScene onTimer");

    if (this.currentCheer) {
      if (this.currentCheer.startTime + this.perMesssagePeriod <= nowTime) {
        this.currentCheer.endTime = nowTime;
        this.currentCheer.processedTimestamp = TimestampUtilities.getNowTimestampNumber();
        this.cheerQueue.writeRequests();
        this.currentCheer = null;
      }
    }
    if (!this.currentCheer) {
      this.currentCheer = this.cheerQueue.getNextRequest();
      if (this.currentCheer == null) {
        this.pause();
        return;
      }
    }
    if (!this.currentCheer.startTime) {
      console.log("CheerScene message: " + this.formatCheer(this.currentCheer));
      this.currentCheer.startTime = nowTime;
    }

    // to do: we should not redraw when we use scrolling
    let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    frameBuffer.print2Lines("Go " + ((this.currentCheer.teamName ? this.currentCheer.teamName : this.currentCheer.colorNames)) + "!",
                            "From:" + this.currentCheer.sender,
                            BitmapBuffer.LITTERA_WHITE_11);
    this.gridzilla.transformScreen(frameBuffer);

    this.runningTimer = setTimeout(this.onTimer.bind(this), 1000);
  }

  //////////////////////////////////////////////////////////////////////////////
  // addCheer 
  //////////////////////////////////////////////////////////////////////////////

  addCheer(request, response) {
    // either of teamName or colorNames is required
    let teamName = request.parameters.teamName;
    let colorNames = request.parameters.teamNames;
    if (!teamName && !colorNames) {
      console.error('CheerScene::cheer - missing teamName or colorNames');
      return;
    }

    // sender is optional
    let sender = request.parameters.sender;
   
    // date and time are optional
    let date = request.parameters.displayDate;
    let time = request.parameters.displayTime;
   
    console.log(`CheerScene addCheer: sender ${sender} teamName: ${teamName} colorNames: ${colorNames} on: ${date} at: ${time}`);
  
    const overUseCheer = this.cheerQueue.checkOverUse(request.sessionId);
    if (overUseCheer != null && overUseCheer != undefined) {
      return this.fillResponse(request, response, "Error", overUseCheer);
    }
    
    // check team name
    if (teamName) {
      const colorNames = teamNameToColorsMap[teamName];
      if (colorNames == undefined || colorNames == null) {
        console.error(`CheerScene::cheer - Invalid team name ${teamName}.`);
        return;
      }
    }

    // check name
    if (sender) {
      let senderOkay = this.nameManager.isNameValid(sender);
      if (!senderOkay) {
        let responseMessage = "We do not recognize the sender name - try a common first name.";
        return this.fillResponse(request, response, "Error", responseMessage);
      }
    }

    const requestObject = {sender, teamName, colorNames};
    
    try {
      const cheerObject = this.cheerQueue.addRequest(request.sessionId, requestObject, date, time);
   
      let responseMessage = "";
      if (teamName) {
        responseMessage += "Go ${teamName}!"
      } else {
        responseMessage += "Go ${colorNames}!"
      }
      responseMessage += `Happy Holidays!`;

      if (date != null && date != undefined && date.length > 0) {
        responseMessage += ` on ${cheerObject.formattedDate}`;
      }
      if (time != null && date != undefined && time.length > 0) {
        responseMessage += ` at ${cheerObject.formattedTime}`;
      }
      responseMessage += `. Your message id is ${cheerObject.id}.`;
 
      return this.fillResponse(request, response, "Okay", responseMessage);
    } catch (error) {
      let message = error.toString();
      return this.fillResponse(request, response, "Error", message);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  
  formatCheer(requestObject) {
    let formattedCheer = "";

    if (requestObject.teamName) {
      formattedCheer += requestObject.teamName;
    }
    if (requestObject.colorNames) {
      formattedCheer += requestObject.colorNames;
    }
    if (requestObject.sender) {
      formattedCheer += ", " + requestObject.sender;
    }

    return formattedCheer;
  }


  fillResponse(request, response, status, message) {
    return response.json({
      sessionId: request.body.sessionId,
      status: status,
      message: message,
      source: 'CheerScene'
    });
  }

}

module.exports = CheerScene;
