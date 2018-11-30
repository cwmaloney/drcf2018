const BitmapBuffer = require("./BitmapBuffer.js");
const Jimp = require('jimp');
const HorizontalScroller = require("./HorizontalScroller.js");
const fs = require('fs');
const Color = require("./Color.js");


class ImageScene {

  constructor(gridzilla, onPaused, configuration) {
    this.gridzilla = gridzilla;
    this.onPaused = onPaused;

    this.configure(configuration);
  
    this.paused = true;
  }

  configure(configuration) {
    const {
      perImagePeriod = 8000,
      period = 30000,
    } = configuration;

    this.perImagePeriod = perImagePeriod;
    this.period = period;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Scene control 
  //////////////////////////////////////////////////////////////////////////////
  
  run() {
    console.log("ImageScene run");
    if (typeof ImageScene.images == 'undefined' || !Array.isArray(ImageScene.images) || ImageScene.images.length == 0)
    {
      this.onPaused();
      return;
    }

    //pick a random image to start with
    this.imageIndex = Math.floor(Math.random() * ImageScene.images.length);
    this.paused = false;
    this.startTime = Date.now();
    this.doImage();
  }

  pause() {
    console.log("ImageScene pause");
    clearTimeout(this.runningTimer);
    
    if (this.scroller1){
      this.scroller1.stop();
      this.scroller1 = null;
    }
    this.paused = true;
    this.onPaused();
  }

  forcePause() {
    console.log("ImageScene forcePause");
    this.pause();
  }

  onImageComplete() {

    const nowTime = Date.now();
    if (this.scroller1){
      this.scroller1.stop();
      this.scroller1 = null;
    }
    //if we can't run the next image completely, stop this scene
    if (nowTime + this.perImagePeriod > this.startTime + this.period){
      this.pause();
      return;
    }
    this.imageIndex = (this.imageIndex + 1) % ImageScene.images.length;
    this.doImage();
  }

  doImage() {
    
    let timeout = this.perImagePeriod;
    const frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    const image = ImageScene.images[this.imageIndex];
    //console.log(`Showing image index [${this.imageIndex}] of ${ImageScene.images.length}`);

    if (image.bitmap.height > frameBuffer.image.bitmap.height) {
      //resize it
      image.resize(Jimp.AUTO, frameBuffer.image.bitmap.height);
    }

    if (image.bitmap.width > frameBuffer.image.bitmap.width) {
      //scroll it
      this.scroller1 = new HorizontalScroller(0, frameBuffer.image.bitmap.height / 2 - image.bitmap.height / 2, frameBuffer, this.gridzilla);
      this.scroller1.scrollImage(image);
    }
    else {
      //show it
      frameBuffer.blit(image, frameBuffer.image.bitmap.width / 2 - image.bitmap.width / 2, 
          frameBuffer.image.bitmap.height / 2 - image.bitmap.height / 2);
      this.gridzilla.transformScreen(frameBuffer);
      timeout = this.perImagePeriod / 2;
    }
    
    this.runningTimer = setTimeout(this.onImageComplete.bind(this), timeout);
  }


  static initialize(){

    const filename = "imageScene.json";
    if (fs.existsSync(filename)) {
      console.log(`loading ImageScene file list from ${filename}...`);
  
      try {
        const fileList = JSON.parse(fs.readFileSync(filename, 'utf8'));

        var promises = [];
        for (let i = 0; i < fileList.images.length; ++i) {
          promises[i] = Jimp.read("images/" + fileList.images[i]).catch((err)=>{console.log(`ImageScene: ${err}`);});
        }
        var resultPromise = Promise.all(promises);
        resultPromise.then( (results) => {
            ImageScene.images = results.filter((elem) => elem != null);
        });
    
        return resultPromise;

      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }  
    }
  }
}

module.exports = ImageScene;
