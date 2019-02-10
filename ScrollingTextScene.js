const BitmapBuffer = require("./BitmapBuffer.js");
const Font = require("./Font.js");
const Color = require("./Color.js");
//const {colorNameToRgb} = require("./config-colors.js");
//const Jimp = require('jimp');
const HorizontalScroller = require("./HorizontalScroller.js");
// const TimestampUtilities = require("./TimestampUtilities.js");

class ScrollingTextScene {

  constructor(gridzilla, facade, onPaused, configuration, gridzillaConfiguration, facadeConfiguration) {
    this.gridzilla = gridzilla;
    this.facade = facade;
    this.onPaused = onPaused;
    this.configure(configuration, gridzillaConfiguration, facadeConfiguration);
  
    this.paused = false;
  }

  configure(configuration, gridzillaConfiguration, facadeConfiguration) {
    const defaults = {
      period: 60000, // time scene should run

      headerText: null,
      scrollText: null,
      minimumInterval: 0, // this minumum intervale between repeating this message
    };

    const defaultGridzillaConfiguration = {
      color: new Color(255, 255, 255),
      backgroundColor: new Color(0, 0, 0),

      speed: 30, // speed is ms between moves

      typeface: "Littera",
      fontSize: 11,

      scrollHeaderTop: undefined,
      scrollTextTop: undefined
    };

    const defaultFacadeConfiguration = {
      color: new Color(255, 255, 255),
      backgroundColor: new Color(0, 0, 0),

      speed: 30, // speed is ms between moves

      typeface: "Littera",
      fontSize: 11,

      scrollHeaderTop: undefined,
      scrollTextTop: undefined
    };

    this.configuration = Object.assign(defaults, configuration);
    this.facadeConfiguration = Object.assign(defaultFacadeConfiguration, facadeConfiguration);
    this.gridzillaConfiguration = Object.assign(defaultGridzillaConfiguration, gridzillaConfiguration);

    this.facadeConfiguration.font = new Font(this.facadeConfiguration.typeface, this.facadeConfiguration.fontSize, this.facadeConfiguration.color);
    this.gridzillaConfiguration.font = new Font(this.gridzillaConfiguration.typeface, this.gridzillaConfiguration.fontSize, this.gridzillaConfiguration.color);
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
    if (this.configuration.minimumInterval) {
      const nowTime = Date.now();
      if (this.lastRunTime && (this.lastRunTime + this.configuration.minimumInterval > nowTime)){
        this.pause();
        return;
      }
    this.lastRunTime = nowTime;
    }

    let timeRequired = 0;
    if (this.gridzilla) {
      this.gridzillaTextScroller = this.showText(this.gridzilla, this.gridzillaConfiguration);
      timeRequired = Math.max(timeRequired, this.getScrollTime(this.gridzilla, this.gridzillaConfiguration) + 1000); // add a second for "rounding"
    }
    if (this.facade) {
      this.facadeTextScroller = this.showText(this.facade, this.facadeConfiguration);
      timeRequired = Math.max(timeRequired, this.getScrollTime(this.facade, this.facadeConfiguration) + 1000); // add a second for "rounding"
    }

    const timeout = Math.min(timeRequired, this.configuration.period);
    this.runningTimer = setTimeout(this.onComplete.bind(this), timeout);
  }

  pause() {
    // console.log("scrollingTextScene pause: " + this.formatMessage())
    clearTimeout(this.runningTimer);

    if (this.gridzillaTextScroller){
      this.gridzillaTextScroller.stop();
      this.gridzillaTextScroller = null;
    }

    if (this.facadeTextScroller){
      this.facadeTextScroller.stop();
      this.facadeTextScroller = null;
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
    this.pause();
    return;
  }

  showText(output, outputConfiguration){
    const frameBuffer = BitmapBuffer.fromNew(output.width, output.height, outputConfiguration.backgroundColor);

    if (this.configuration.headerText && this.configuration.headerText != "") {
      frameBuffer.print1Line(this.configuration.headerText, outputConfiguration.font, outputConfiguration.headerTextTop);
      output.transformScreen(frameBuffer);
    }

    const scroller = new HorizontalScroller(0, outputConfiguration.scrollTextTop, frameBuffer, output);
    scroller.scrollText(this.configuration.scrollText, outputConfiguration.font, outputConfiguration.speed);

    return scroller;
  }

  getScrollTime(output, outputConfiguration) {
    return HorizontalScroller.calculateImageScrollTime(this.configuration.scrollText, outputConfiguration.font, output.width, outputConfiguration.speed);
  }
 
  formatMessage() {
    return (this.configuration.headerText) ? `header: ${this.configuration.headerText}, ` : "" + `${this.configuration.scrollText}`;
  }
   
}

module.exports = ScrollingTextScene;
