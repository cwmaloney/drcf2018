const BitmapBuffer = require("./BitmapBuffer.js");
const Jimp = require('jimp');
const HorizontalScroller = require("./HorizontalScroller.js");
const Color = require("./Color.js");
const ImageManager = require("./ImageManager.js");


class ImageScene {

  constructor(gridzilla, onPaused, configuration) {
    this.gridzilla = gridzilla;
    this.onPaused = onPaused;

    this.configure(configuration);
    this.imageIndex = 0;
    this.paused = true;
  }

  configure(configuration) {
    const {
      period = 30000,         // time scene should run
      perImagePeriod = 8000,  // time image should be "run""
      imagesConfiguration = null
    } = configuration;

    this.perImagePeriod = perImagePeriod;
    this.period = period;
    this.imagesConfiguration = imagesConfiguration;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Scene control 
  //////////////////////////////////////////////////////////////////////////////
  
  run() {
    console.log("ImageScene run");
    if (typeof this.imagesConfiguration == 'undefined'
        || !Array.isArray(this.imagesConfiguration)
        || this.imagesConfiguration.length == 0)
    {
      this.onPaused();
      return;
    }

    this.paused = false;
    this.startTime = Date.now();
    this.displayImage();
  }

  pause() {
    console.log("ImageScene pause");
    clearTimeout(this.runningTimer);
    
    this.killScrollers();
    
    this.paused = true;
    this.onPaused();
  }

  killScrollers() {
    if (this.gridzillaScroller){
      this.gridzillaScroller.stop();
      this.gridzillaScroller = null;
    }

    // if (this.facadeScroller){
    //   this.facadeScroller.stop();
    //   this.facadeScroller = null;
    // }
  }

  forcePause() {
    console.log("ImageScene forcePause");
    this.pause();
  }


  onImageComplete() {
    const nowTime = Date.now();
    this.killScrollers();
    this.imageIndex = (this.imageIndex + 1) % this.imagesConfiguration.length;

    //if we can't run the next image completely, stop this scene
    if (nowTime + this.perImagePeriod > this.startTime + this.period){
      this.pause();
      return;
    }

    this.displayImage();
  }

 displayImage() {   
    let timeout = this.perImagePeriod;
    const frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    const imagesConfiguration = this.imagesConfiguration[this.imageIndex];
    const imageName = imagesConfiguration.name;
    if (imagesConfiguration.period) {
      timeout = imagesConfiguration.period;
    }
    const image = ImageManager.get(imageName);
    if (!image) {
      console.log(`*** Missing image [${imageName}]`);
      this.onImageComplete();
      return;
    }

    console.log(`Showing image [${imageName}]`);

    if (image.bitmap.height > frameBuffer.image.bitmap.height) {
      //resize it
      image.resize(Jimp.AUTO, frameBuffer.image.bitmap.height);
    }

    if (image.bitmap.width > frameBuffer.image.bitmap.width) {
      //scroll it
      this.gridzillaScroller = new HorizontalScroller(0, frameBuffer.image.bitmap.height / 2 - image.bitmap.height / 2, frameBuffer, this.gridzilla);
      this.gridzillaScroller.scrollImage(image);
    }
    else {
      //show it
      frameBuffer.blit(image,
                       frameBuffer.image.bitmap.width / 2 - image.bitmap.width / 2, 
                       frameBuffer.image.bitmap.height / 2 - image.bitmap.height / 2);
      this.gridzilla.transformScreen(frameBuffer);
      timeout = this.perImagePeriod;
    }
    
    this.runningTimer = setTimeout(this.onImageComplete.bind(this), timeout);
  }

}

module.exports = ImageScene;
