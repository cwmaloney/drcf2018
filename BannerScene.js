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

  run() {
    this.paused = false;
    this.startTime = new Date();
    onTimer(this);
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

}


function onTimer(scene) {
  const nowTime = new Date()
  if (scene.startTime + scene.period > nowTime) {
    scene.pause();
    scene.onPaused();
  }

  if (scene.line3) {
    let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    frameBuffer.print3Lines(scene.line1, scene.line2, scene.line3,
      BitmapBuffer.LITTERA_RED_11);
      scene.gridzilla.transformScreen(frameBuffer);
  } else if (scene.line2) {
    let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    frameBuffer.print2Lines(scene.line1, scene.line2, BitmapBuffer.LITTERA_RED_16);
    scene.gridzilla.transformScreen(frameBuffer);
  } else if (scene.line1) {
    let frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    frameBuffer.print1Line(scene.line1, BitmapBuffer.LITTERA_RED_16);
    scene.gridzilla.transformScreen(frameBuffer);
  }

  scene.runningTimer = setTimeout(onTimer, 1000, this); 
}

module.exports = BannerScene;
