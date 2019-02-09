const BitmapBuffer = require("./BitmapBuffer.js");
const Font = require("./Font.js");
const Color = require("./Color.js");
//const {colorNameToRgb} = require("./config-colors.js");
const Jimp = require('jimp');
const HorizontalScroller = require("./HorizontalScroller.js");
// const TimestampUtilities = require("./TimestampUtilities.js");

class ScrollingTextScene {

  constructor(outputGrid, onPaused, configuration) {
    this.outputGrid = outputGrid;
    this.onPaused = onPaused;
    this.configure(configuration);
  
    this.paused = false;
  }

  configure(configuration) {
    const {
      period = 60000, // time scene should run

      headerText = null,
      scrollText = null,

      color = new Color(255, 255, 255),
      backgroundColor = new Color(0, 0, 0),

      speed = null, // speed is ms between moves
      minimumInterval = 0, // this minumum intervale between repeating this message

      typeface = "Littera",
      fontSize = 11,

      scrollHeaderTop = undefined,
      scrollTextTop = undefined

    } = configuration;

    this.period = period;

    this.headerText = headerText;
    this.scrollText = scrollText;

    this.color = color;
    this.backgroundColor = backgroundColor;

    this.speed = speed;
    this.minimumInterval = minimumInterval;

    this.typeface = typeface;
    this.fontSize = fontSize;

    this.scrollHeaderTop = scrollHeaderTop;
    this.scrollTextTop = scrollTextTop;

    if (this.headerText && this.headerText != "" && !this.headerTextTop) {
      throw "ScrollingTextSceen missing headerTextTop"
    }

    if (!this.scrollTextTop ) {
      throw "ScrollingTextSceen missing scrollTextTop"
    }

    this.bufferHeight = this.fontSize + 5; // TODO why 5?
 }

  //////////////////////////////////////////////////////////////////////////////
  // Scene control 
  //////////////////////////////////////////////////////////////////////////////

  run() {
    console.log("ScrollingTextScene run: " + this.formatMessage())
    this.paused = false;
    this.startTime = Date.now();
    this.runScene();
  }

  runScene() {
    if (this.minimumInterval) {
      const nowTime = Date.now();
      if (this.lastRunTime && (this.lastRunTime + this.minimumInterval > nowTime)){
        this.pause();
        return;
      }
    this.lastRunTime = nowTime;
    }
    const timeRequired = this.showText() + 1000; // add a second
    const timeout = Math.min(timeRequired, this.period);
    this.runningTimer = setTimeout(this.onComplete.bind(this), timeout);
  }

  pause() {
    // console.log("scrollingTextScene pause: " + this.formatMessage())
    clearTimeout(this.runningTimer);

    if (this.messageScroller){
      this.messageScroller.stop();
      this.messageScroller = null;
    }
    this.paused = true;
    this.onPaused();
  }

  forcePause() {
    console.log("scrollingTextScene forcePause: " + this.formatMessage())
    this.pause();
  }

  onComplete() {
    this.lastRunTime = Date.now();

    if (this.messageScroller){
      this.messageScroller.stop();
      this.messageScroller = null;
    }

    this.pause();
    return;
  }

  showText(){
    const frameBuffer = BitmapBuffer.fromNew(this.outputGrid.width, this.outputGrid.height, this.backgroundColor);

    const font = new Font(this.typeface, this.fontSize, this.color);

    if (this.headerText && this.headerText != "") {
      frameBuffer.print1Line(this.headerText, font, this.headerTextTop);
      this.outputGrid.transformScreen(frameBuffer);
    }

    const jimpFont = BitmapBuffer.getJimpFont(font);
    const textWidth = Jimp.measureText(jimpFont, this.scrollText) + 8; // TODO why 8

    let textBuffer = BitmapBuffer.fromNew(textWidth, this.bufferHeight, new Color(0, 0, 0));
    textBuffer.print(this.scrollText, font, 0, 0);

    this.messageScroller = new HorizontalScroller(0, this.scrollTextTop, frameBuffer, this.outputGrid);
    this.messageScroller.scrollImage(textBuffer.image, this.speed, this.outputGrid.width);

    return HorizontalScroller.calculateImageScrollTime(textWidth, this.outputGrid.width, this.speed);
  }
 
  formatMessage() {
    let formattedMessage = ''

    formattedMessage = `${this.headerText}, ${this.scrollText}`;

    return formattedMessage;
  }
   
}

module.exports = ScrollingTextScene;
