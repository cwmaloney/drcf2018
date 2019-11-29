const BitmapBuffer = require("./BitmapBuffer.js");
const Jimp = require('jimp');
const HorizontalScroller = require("./HorizontalScroller.js");

const Font = require("./Font.js");
const Color = require("./Color.js");

const TimestampUtilities = require("./TimestampUtilities.js");
const { teamNameToDataMap } = require("./config-teams.js");
const { colorNameToRgb } = require("./config-colors.js");
const ImageManager = require("./ImageManager.js");



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
  
  getActiveRequestCount() {
    return this.cheerQueue.getActiveRequests().length;
  }

  getQueuedRequestCount() {
    return this.cheerQueue.getQueuedRequests().length;
  }

  getCheerQueue() {
    return this.cheerQueue.getRequests();
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

  doCheer() {
     
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

    let timeout = this.perCheerPeriod;
    
    if (this.currentCheer.teamName != null) {
      this.showTeamAnimation();
      timeout = Math.min(timeout, 10000);
    }
    else {
      switch(Math.floor(Math.random() * 2)){
        case(0):
        default:
          this.showColorWords();
          break;
        case(1):
          this.showColorTrees();
          break;
      }
      timeout = Math.min(timeout, 10000);

    }
    
    this.runningTimer = setTimeout(this.onCheerComplete.bind(this), timeout);
  }

  showTeamAnimation(){
    const teamData = teamNameToDataMap[this.currentCheer.teamName];
    let colors = [];
    for (let i = 0;  i < teamData.colors.length; ++i){
      colors[i] = new Color(colorNameToRgb[teamData.colors[i]][0], colorNameToRgb[teamData.colors[i]][1], colorNameToRgb[teamData.colors[i]][2])
    }

    let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));

    //show image
    let teamImage = this.getTeamImage(teamData, colors);
    if (teamImage.bitmap.height > frameBuffer.image.bitmap.height) {
      teamImage.resize(Jimp.AUTO, frameBuffer.image.bitmap.height);
    }
    frameBuffer.blit(teamImage, 0, 0);

    //show text
    this.scroller1 = new HorizontalScroller(teamImage.bitmap.width + 2, 10, frameBuffer, this.gridzilla);

    let message;
    if (teamData.cheers.length == 0) {
      message = this.currentCheer.sender ? "From " + this.currentCheer.sender : " Hooray!";
    }
    else{
      message = this.currentCheer.sender ? this.currentCheer.sender + " says: " : "";
      message = message + teamData.cheers[Math.floor(Math.random() * teamData.cheers.length)];
    }
    const font16 = new Font("Littera", 16, colors[0]);
    this.scroller1.scrollText(message, font16, null, null);
    
  }

  getTeamImage(teamData, colors){
    if (teamData.imageNames != null && Array.isArray(teamData.imageNames) && teamData.imageNames.length > 0){
      let imageName = teamData.imageNames[Math.floor(Math.random() * teamData.imageNames.length)];
      return ImageManager.get(imageName);
    }
    else{
      let random = Math.floor(Math.random() * 2);
      if (random == 0 && colors.length == 2){
        return this.getPennantImage(colors);
      }
      else {
        let treeImage = ImageManager.get("replaceTree36.png").clone();
        let treeBuff = BitmapBuffer.fromImage(treeImage);
        treeBuff.switchColor(new Color(255, 0, 0), colors);
        return treeBuff.image;
      }
    }
  }

  getPennantImage(colors){
    //Pennant fill color
    let color1 = colors[0];
    //Pennant outline color
    let color2 = colors[1];

    //if color2 is black, switch the colors
    if (color2.toInt() == Color.fromRgb(colorNameToRgb.Black).toInt()){
      color2 = colors[0];
      color1 = colors[1];
    }

    let pennantBuffer = BitmapBuffer.fromNew(24, 36, new Color(0, 0, 0));

    //draw the pole
    pennantBuffer.fillRect(0, 16, 3, 19, Color.fromRgb(colorNameToRgb.Brown));
    pennantBuffer.drawPixel(1, 0, Color.fromRgb(colorNameToRgb.Brown));
    pennantBuffer.drawLine(0, 1, 2, 1, Color.fromRgb(colorNameToRgb.Brown));
    pennantBuffer.drawPixel(1, 35, Color.fromRgb(colorNameToRgb.Brown));

    //draw a triangle with a line width of 2 and fill it
    pennantBuffer.fillRect(0, 2, 2, 14, color2);
    pennantBuffer.drawLine(1, 2, 23, 8, color2);
    pennantBuffer.drawLine(1, 3, 23, 9, color2);
    pennantBuffer.drawLine(1, 15, 23, 9, color2);
    pennantBuffer.drawLine(1, 14, 23, 8, color2);
    pennantBuffer.fill(3, 8, color1);

    return pennantBuffer.image;
  }

  showColorWords(){
    let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));


    let y = 10;
    if (this.currentCheer.sender != null && this.currentCheer.sender != "") {
      const font11 = new Font("Littera", 11, new Color(255, 255, 255));
      frameBuffer.print1Line(this.currentCheer.sender + " cheers for:", font11, 0);
      this.gridzilla.transformScreen(frameBuffer);
      y = 16;
    }

    let length = 0;
    let font = new Font("Littera", 16, new Color(255, 255, 255));
    let jimpFont = BitmapBuffer.getJimpFont(font);
    for (let i = 0; i < this.currentCheer.colorNames.length && i < 10; ++i) {
      length += Jimp.measureText(jimpFont, this.currentCheer.colorNames[i]) + 4;
    }

    let x = 0;
    let textBuffer = BitmapBuffer.fromNew(length, 18, new Color(0, 0, 0));
    for (let i = 0; i < this.currentCheer.colorNames.length && i < 10; ++i) {
      font = new Font("Littera", 16, Color.fromRgb(colorNameToRgb[this.currentCheer.colorNames[i]]));
      x = x + textBuffer.print(this.currentCheer.colorNames[i], font, x, 0)[0] + 4;
    }

    this.scroller1 = new HorizontalScroller(0, y, frameBuffer, this.gridzilla);
    this.scroller1.scrollImage(textBuffer.image, null, 168);
  }

  showColorTrees(){
    let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));

    let y = 6;
    if (this.currentCheer.sender != null && this.currentCheer.sender != "") {
      const font11 = new Font("Littera", 11, new Color(255, 255, 255));
      frameBuffer.print1Line(this.currentCheer.sender + " cheers for:", font11, 0);
      this.gridzilla.transformScreen(frameBuffer);
      y = 12;
    }

    //Limit the maximum nubmer of colors to 20
    let treeCount = Math.min(this.currentCheer.colorNames.length, 20);
    //Draw at least 8 trees, to fill the screen horizontally
    if (treeCount < 8){
      treeCount = Math.ceil(8 / this.currentCheer.colorNames.length) * this.currentCheer.colorNames.length; 
    }

    let treeBuffer = BitmapBuffer.fromNew(treeCount * 21, 24, new Color(0, 0, 0));
    for (let i = 0; i < treeCount; ++i){
      let color = Color.fromRgb(colorNameToRgb[this.currentCheer.colorNames[i % this.currentCheer.colorNames.length]]);
      this.drawTree(treeBuffer, color, i * 21, 0);
    }
    this.scroller1 = new HorizontalScroller(0, y, frameBuffer, this.gridzilla);
    this.scroller1.scrollImage(treeBuffer.image, null, 168, null, true);

  }

  /**
   * Draws a tree of a specific color, requires a region 21 pixels wide and 24 pixels high
   * @param {BitmapBuffer} buffer The buffer to draw on
   * @param {Color} color The color for the tree
   * @param {number} x The left edge position for the tree
   * @param {number} y The top edge position for the tree
   */
  drawTree(buffer, color, x, y = 0){
    //draw the triangle
    buffer.drawLine(x + 3, y + 20, x + 10, y + 2, color);
    buffer.drawLine(x + 10, y + 2, x + 18, y + 20, color);
    buffer.drawLine(x + 18, y + 20, x + 3, y + 20, color);
    //fill the triangle
    buffer.fill(x + 10, y + 19, color);
    //draw the trunk
    buffer.fillRect(x + 9, y + 21, 3, 3, new Color(139,69,19));
    //draw the light on top
    buffer.drawPixel(x + 9, y + 0, new Color(127, 127, 0));
    buffer.drawPixel(x + 10, y + 0, new Color(255, 255, 0));
    buffer.drawPixel(x + 11, y + 0, new Color(127, 127, 0));
    buffer.drawPixel(x + 9, y + 1, new Color(127, 127, 0));
    buffer.drawPixel(x + 10, y + 1, new Color(255, 255, 0));
    buffer.drawPixel(x + 11, y + 1, new Color(127, 127, 0));
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

    if (!teamName && Array.isArray(colorNames) && colorNames.length == 0){
      let responseMessage = "Please select at least one color.";
      return this.fillResponse(request, response, "Error", responseMessage);
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
