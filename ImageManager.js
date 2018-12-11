"use strict";

const Jimp = require('jimp');
const fs = require('fs');


class ImageManager {

  /**
   * Get an image by filename
   * @param {string} name Filename of the image to get
   */
  static get(name) {
    return ImageManager.images.get(name);
  }

  static initialize(){
    const filename = "imageManager.json";
    if (fs.existsSync(filename)) {
      console.log(`loading ImageManager file list from ${filename}...`);
  
      try {
        const fileList = JSON.parse(fs.readFileSync(filename, 'utf8'));

        var promises = [];
        for (let i = 0; i < fileList.images.length; ++i) {
          promises[i] = Jimp.read("images/" + fileList.images[i]).catch((err)=>{console.log(`ImageScene: ${err}`);});
        }
        ImageManager.images = new Map();

        var resultPromise = Promise.all(promises);
        resultPromise.then( (results) => {
            for (let i = 0; i < fileList.images.length; ++i) {
              ImageManager.images.set(fileList.images[i], results[i]);
            }
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

module.exports = ImageManager;
