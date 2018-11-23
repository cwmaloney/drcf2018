const BitmapBuffer = require("./BitmapBuffer.js");
const Font = require("./Font.js");
const Color = require("./Color.js");
const colorNameToRgb = require("./config-colors.js");

class BannerScene {

  constructor(grizilla, onPaused, configuration) {
    this.grizilla = grizilla;
    this.onPaused = onPaused;
    this.configure(configuration);
  
    this.paused = false;
  }

  configure(configuration) {
    const {
      period = 4000,

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

  run() {
    this.paused = false;
    this.startTime = new Date();
    this.onTimer();
  }

  pause() {
    clearTimeout(this.runningTimer);
    this.paused = true;
    this.onPaused();
  }

  forcePause() {
    this.paused = true;
    this.onPaused();
  }

  onTimer() {
    const nowTime = new Date()
    if (this.startTime + this.period > nowTime) {
      this.pause();
      this.onPaused();
    }

    if (this.line3) {
      let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
      frameBuffer.print3Lines(this.line1, this.line2, this.line3,
        BitmapBuffer.LITTERA_WHITE_11, BitmapBuffer.LITTERA_WHITE_11, BitmapBuffer.LITTERA_WHITE_11);
      this.gridzilla.transformScreen(frameBuffer);
    } else if (this.line2) {
      let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
      frameBuffer.print2Lines("Deanna Rose", "Children's Farmstead", BitmapBuffer.LITTERA_WHITE_16, BitmapBuffer.LITTERA_WHITE_16);
      this.gridzilla.transformScreen(frameBuffer);
    } else if (this.line1) {
      let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
      frameBuffer.print1Line("Deanna Rose", "Children's Farmstead", BitmapBuffer.LITTERA_WHITE_16);
      this.gridzilla.transformScreen(frameBuffer);
    }

    this.runningTimer = setTimeout(this.onTimer, 1000); 
  }

}

module.exports = BannerScene;
