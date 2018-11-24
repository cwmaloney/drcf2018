const BitmapBuffer = require("./BitmapBuffer.js");
const Font = require("./Font.js");
const Color = require("./Color.js");
const colorNameToRgb = require("./config-colors.js");

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
      line3 = null,

      font1 = new Font("", 11, new Color(colorNameToRgb.White)),
      font2 = new Font("", 11, new Color(colorNameToRgb.White)),
      font3 = new Font("", 11, new Color(colorNameToRgb.White)),
    } = configuration;

    this.period = period;

    this.line1 = line1;
    this.line2 = line2;
    this.line3 = line3;

    this.font1 = font1;
    this.font2 = font2;
    this.font3 = font3;
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
      let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
      frameBuffer.print3Lines(this.line1, this.line2, this.line3,
        BitmapBuffer.LITTERA_RED_11);
        this.gridzilla.transformScreen(frameBuffer);
    } else if (this.line2) {
      let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
      frameBuffer.print2Lines(this.line1, this.line2, BitmapBuffer.LITTERA_RED_16);
      this.gridzilla.transformScreen(frameBuffer);
    } else if (this.line1) {
      let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
      frameBuffer.print1Line(this.line1, BitmapBuffer.LITTERA_RED_16);
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
