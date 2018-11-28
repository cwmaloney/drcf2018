const BitmapBuffer = require("./BitmapBuffer.js");
const Jimp = require('jimp');
const HorizontalScroller = require("./HorizontalScroller.js");

//const Font = require("./Font.js");
const Color = require("./Color.js");

//const colorNameToRgb = require("./config-colors.js");
const TimestampUtilities = require("./TimestampUtilities.js");
const { teamNameToDataMap } = require("./config-teams.js");
const {colorNameToRgb} = require("./config-colors.js");


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
      perCheerPeriod = 10000,
      period = 60000,
    } = configuration;

    //perCheerPeriod is a maximum, some cheers are shorter, but never longer
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
    this.doCheer();
  }

  pause() {
    console.log("CheerScene pause");
    clearTimeout(this.runningTimer);
    if (this.currentCheer) {
      // cheer did not finish so we will restart the cheer
      // when the scene restarts
      this.currentCheer.startTime = undefined;
    }
    if (this.scroller1){
      this.scroller1.stop();
      this.scroller1 = null;
    }
    this.paused = true;
    this.onPaused();
  }

  forcePause() {
    console.log("CheerScene forcePause");
    this.pause();
  }

  onCheerComplete() {

    const nowTime = Date.now();
    this.currentCheer.endTime = nowTime;
    this.currentCheer.processedTimestamp = TimestampUtilities.getNowTimestampNumber();
    this.cheerQueue.writeRequests();
    this.currentCheer = null;
    if (this.scroller1){
      this.scroller1.stop();
      this.scroller1 = null;
    }
    //if we can't run the next cheer completely, stop this scene
    if (nowTime + this.perCheerPeriod > this.startTime + this.period){
      this.pause();
      return;
    }

    this.doCheer();
  }

  async doCheer() {
     
    if (this.currentCheer) {
      if (!this.currentCheer.startTime) {
        console.log(`CheerScene restarting=${this.formatCheer(this.currentCheer)} id=${this.currentCheer.id}`);
        this.currentCheer.startTime = Date.now();
      }
    }
    else {
      this.currentCheer = this.cheerQueue.getNextRequest();
      if (this.currentCheer == null) {
        this.pause();
        return;
      }
      console.log(`CheerScene starting=${this.formatCheer(this.currentCheer)} id=${this.currentCheer.id}`);
      this.currentCheer.startTime = Date.now();
    }
    const sender = this.currentCheer.sender;

    let timeout = this.perCheerPeriod;
    
    if (this.currentCheer.teamName != null) {
      const teamData = teamNameToDataMap[this.currentCheer.teamName];
      let colors = [];
      for (let i = 0;  i < teamData.colors.length; ++i){
        colors[i] = new Color(colorNameToRgb[teamData.colors[i]][0], colorNameToRgb[teamData.colors[i]][1], colorNameToRgb[teamData.colors[i]][2])
      }

      let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));

      let treeImage = await Jimp.read("images/replaceTree36.png");
      let treeBuff = BitmapBuffer.fromImage(treeImage);
      treeBuff.switchColor(new Color(255, 0, 0), colors);
      frameBuffer.blit(treeBuff.image, 0, 0);
      frameBuffer.blit(treeBuff.image, 144, 0);
      this.scroller1 = new HorizontalScroller(24, 10, frameBuffer, this.gridzilla);

      let message;
      if (teamData.cheers.length == 0)
      {
        message = sender ? sender + " says: " : "";
        message = message + teamData.cheers[Math.floor(Math.random() * teamData.length)];
      }
      else{
        message = sender ? "From " + sender : "Hooray!";
      }
      this.scroller1.scrollText(sender + " says:" + teamData.cheers[0], BitmapBuffer.LITTERA_WHITE_16, null, 120, 8000);
      timeout = Math.min(timeout, 10000);
    }
    else {
      let message = (sender == null || sender == "") ? "Hooray!" : "Cheer from " + sender + "!";
      let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));

      if (sender == null || sender == "") {
        frameBuffer.print1Line("Go " + this.currentCheer.colorNames + "!",
          BitmapBuffer.LITTERA_WHITE_16);
      }
      else  {
        frameBuffer.print2Lines("Go " + this.currentCheer.colorNames + "!",
          "From: " + sender,
          BitmapBuffer.LITTERA_WHITE_16);
      }
      this.gridzilla.transformScreen(frameBuffer);
      timeout = Math.min(timeout, 5000);
    }
    
    this.runningTimer = setTimeout(this.onCheerComplete.bind(this), timeout);
  }

  //////////////////////////////////////////////////////////////////////////////
  // addCheer 
  //////////////////////////////////////////////////////////////////////////////

  addCheer(request, response) {
    // either of teamName or colorNames is required
    let teamName = request.body.teamName;
    let colorNames = request.body.colorNames;
    if (!teamName && !colorNames) {
      console.error('CheerScene::cheer - missing teamName or colorNames');
      return;
    }

    // sender is optional
    let sender = request.body.sender;
   
    // date and time are optional
    let date = request.body.displayDate;
    let time = request.body.displayTime;
   
    console.log(`CheerScene addCheer: sender ${sender} teamName: ${teamName} colorNames: ${colorNames} on: ${date} at: ${time}`);
  
    const overUseCheer = this.cheerQueue.checkOverUse(request.body.sessionId);
    if (overUseCheer != null && overUseCheer != undefined) {
      return this.fillResponse(request, response, "Error", overUseCheer);
    }
    
    // check team name
    if (teamName) {
      const teamData = teamNameToDataMap[teamName];
      if (teamData == undefined || teamData == null) {
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

    const requestObject = {sessionId: request.body.sessionId, sender, teamName, colorNames};
    
    try {
      this.cheerQueue.addRequest(requestObject);
   
      let responseMessage = "";
      if (teamName) {
        responseMessage += `Go ${teamName}!`;
      } else {
        responseMessage += `Go ${colorNames}!`;
      }

      if (date != null && date != undefined && date.length > 0) {
        responseMessage += ` on ${requestObject.formattedDate}`;
      }
      if (time != null && date != undefined && time.length > 0) {
        responseMessage += ` at ${requestObject.formattedTime}`;
      }
      responseMessage += `. Your cheer id is ${requestObject.id}.`;
 
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