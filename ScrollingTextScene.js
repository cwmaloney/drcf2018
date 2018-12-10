const BitmapBuffer = require("./BitmapBuffer.js");
const Font = require("./Font.js");
const Color = require("./Color.js");
//const {colorNameToRgb} = require("./config-colors.js");
const Jimp = require('jimp');
const HorizontalScroller = require("./HorizontalScroller.js");
const TimestampUtilities = require("./TimestampUtilities.js");

class ScrollingTextScene {

  constructor(gridzilla, onPaused, configuration) {
    this.gridzilla = gridzilla;
    this.onPaused = onPaused;
    this.configure(configuration);
  
    this.paused = false;
  }

  configure(configuration) {
    const {
      period = 60000,

      topLine = null,
      bottomLine = null,
      color = null,
      backgroundColor = null,
      speed = null,
      frequency = 5 * 60 * 1000
    } = configuration;

    this.period = period;

    this.topLine = topLine;
    this.bottomLine = bottomLine;
    this.color = color;
    this.backgroundColor = backgroundColor;
    this.speed = speed;
    this.frequency = frequency;
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
    const nowTime = Date.now();
    if (this.lastRunTime && (this.lastRunTime + this.frequency > nowTime)){
      this.pause();
      return;
    }
    this.lastRunTime = nowTime;
    const timeRequired = this.showText() + 2000;
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
    const backgroundColor = this.backgroundColor ? this.backgroundColor : new Color(0, 0, 0);
    const color = this.color ? this.color : new Color(255, 255, 255);
    const typeface = this.typeface ? this.typeface : "Littera";

    const frameBuffer = BitmapBuffer.fromNew(168, 36, backgroundColor);

    const font11 = new Font(typeface, 11, color);

    let topOfSecondLine = 10;
    if (this.topLine && this.topLine != "") {
      frameBuffer.print1Line(this.topLine, font11, 4);
      this.gridzilla.transformScreen(frameBuffer);
      topOfSecondLine = 18;
    }

    const jimpFont = BitmapBuffer.getJimpFont(font11);
    const length = Jimp.measureText(jimpFont, this.bottomLine) + 8;

    let textBuffer = BitmapBuffer.fromNew(length, 16, new Color(0, 0, 0));
    textBuffer.print(this.bottomLine, font11, 0, 0);

    this.messageScroller = new HorizontalScroller(0, topOfSecondLine, frameBuffer, this.gridzilla);
    this.messageScroller.scrollImage(textBuffer.image, this.speed, 168);

    return HorizontalScroller.calculateImageScrollTime(length, 168, this.speed);
  }
 
  formatMessage() {
    let formattedMessage = ''

    formattedMessage = `${this.line1}, ${this.line2}`;

    return formattedMessage;
  }
   
}

module.exports = ScrollingTextScene;
