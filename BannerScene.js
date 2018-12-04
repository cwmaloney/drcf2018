const BitmapBuffer = require("./BitmapBuffer.js");
const Font = require("./Font.js");
const Color = require("./Color.js");
//const {colorNameToRgb} = require("./config-colors.js");

class BannerScene {

  constructor(gridzilla, onPaused, configuration) {
    this.gridzilla = gridzilla;
    this.onPaused = onPaused;
    this.configure(configuration);
  
    this.paused = false;
  }

  configure(configuration) {
    const {
      period = 3000,

      line1 = null,
      line2 = null,
      line3 = null
    } = configuration;

    this.period = period;

    this.line1 = line1;
    this.line2 = line2;
    this.line3 = line3;
 }

  //////////////////////////////////////////////////////////////////////////////
  // Scene control 
  //////////////////////////////////////////////////////////////////////////////

  pause() {
    // console.log("bannerScene pause: " + this.formatMessage())
    clearTimeout(this.runningTimer);
    this.paused = true;
    this.onPaused();
  }

  forcePause() {
    console.log("bannerScene forcePause: " + this.formatMessage())
    this.pause();
  }

  onTimer() {
    const nowTime = Date.now();
    if (this.startTime + this.period <= nowTime) {
      this.pause();
      return;
    }
  
    // console.log("bannerScene onTimer: " + this.formatMessage())
  
    if (this.line3) {
      const frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
      const font = new Font("Littera", 11, new Color(255, 0, 0));
      frameBuffer.print3Lines(this.line1, this.line2, this.line3, font);
        this.gridzilla.transformScreen(frameBuffer);
    } else if (this.line2) {
      const frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
      const font = new Font("Littera", 16, new Color(255, 0, 0));
      frameBuffer.print2Lines(this.line1, this.line2, font);
      this.gridzilla.transformScreen(frameBuffer);
    } else if (this.line1) {
      const frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
      const font = new Font("Littera", 18, new Color(255, 0, 0));
      frameBuffer.print1Line(this.line1, font);
      this.gridzilla.transformScreen(frameBuffer);
    }
  
    this.runningTimer = setTimeout(this.onTimer.bind(this), 1000); 
  }

  run() {
    console.log("BannerScene run: " + this.formatMessage())
    this.paused = false;
    this.startTime = Date.now();
    this.onTimer();
  }
 
  formatMessage() {
    let formattedMessage = ''

    formattedMessage = `${this.line1}, ${this.line2}, ${this.line3}`;

    return formattedMessage;
  }
   
}

module.exports = BannerScene;
