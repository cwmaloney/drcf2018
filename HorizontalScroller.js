"use strict";

const Jimp = require('jimp');
const BitmapBuffer = require("./BitmapBuffer.js");

class HorizontalScroller{



    /**
     * Create a new instace to manage horizontal scrolling of an item
     * @param {number} x Where to position the scrolling item
     * @param {number} y Where to position the scrolling item
     * @param {BitmapBuffer} buffer The destination buffer to place the scrolling item on
     * @param {(GridzillaTransform | EmulatorTransform)} transform The transform responsible for transforming to the target display
     */
     constructor(x, y, buffer, transform){
        this.destX = x;
        this.destY = y;
        this.buffer = buffer;
        this.transform = transform;
     }

     static calculateImageScrollTime(text, font, screenSize, speed) {
      const jimpFont = BitmapBuffer.getJimpFont(font);
      const textWidth = Jimp.measureText(jimpFont, text);
      return (textWidth - screenSize) * speed;
     }

     /**
      * Scrolls the supplied image on the destination
      * @param {Jimp} image The sorce image to scroll
      * @param {number} speed [40] The speed to scroll at, in ms between refreshes
      * @param {number} width [max available or max of the source]  
      * How much of the source image to show, use to crop the source image, a value larger than the source image will be ignored
      * @param {number} maxTime [300000] maximum time to scroll
      * @param {boolean} forceScroll [false] set to true to scroll regardless of width
      */
     async scrollImage(image, speed, width, maxTime, forceScroll = false){
        this.stop();
        if (maxTime == null) {
            maxTime = 300000; //5 minutes
        }
        if (speed == null) {
            speed = 40;
        }

        if (width == null){
            width = this.buffer.image.bitmap.width - this.destX;
        } else {
            width = Math.min(this.buffer.image.bitmap.width - this.destX, width);
        }
        if (!forceScroll && image.bitmap.width <= width){
            this.buffer.blit(image, this.destX + (width - image.bitmap.width) / 2, this.destY);
            this.transform.transformScreen(this.buffer);
            return;
        }

        const srcWidth = image.bitmap.width;
        const srcHeight = image.bitmap.height;
        let srcX = 0;
        const srcY = 0;
        let blit1width = Math.min(width, srcWidth - srcX);
        this.buffer.image.blit(image, this.destX, this.destY, srcX++, srcY, blit1width, srcHeight);
        this.transform.transformScreen(this.buffer);

        this.interval = setInterval(() => {
            maxTime -= speed;
            if (maxTime < 0){
                this.stop();
            }
            blit1width = Math.min(width, srcWidth - srcX);
            let blit2width = Math.min(width - blit1width, image.bitmap.width - blit1width);
            this.buffer.image.blit(image, this.destX, this.destY, srcX++, srcY, blit1width, srcHeight);
            if (blit2width > 0){
                this.buffer.image.blit(image, this.destX + blit1width, this.destY, 0, srcY, blit2width, srcHeight);
            }
            
            this.transform.transformScreen(this.buffer);

            if (srcX >= srcWidth) {
                srcX = 0;
            }
        }, speed);
     }

    /**
      * Scrolls the supplied buffer on the destination
      * @param {BitmapBuffer} buffer The sorce image to scroll
      * @param {number} speed [40] The speed to scroll at, in ms between refreshes
      * @param {number} width [max available or max of the source]   
      * How much of the source image to show, use to crop the source image, a value larger than the source image will be ignored
      * @param {number} maxTime [300000] maximum time to scroll
      */
     async scrollBuffer(buffer, speed, width, maxTime){
        this.scrollImage(buffer.image, speed, width, maxTime);
     }

    /**
      * Scrolls the supplied text on the destination
      * @param {string} text The text to scroll
      * @param {Font} font The font to use
      * @param {number} speed [30] The speed to scroll at, in ms between refreshes
      * @param {number} width [max available or max of the source]
      * How much of the source text to show, use to limit the right boundry of the scrolling area
      * @param {number} maxTime [300000] maximum time to scroll
      */
     async scrollText(text, font, speed, width, maxTime){
        const jimpFont = BitmapBuffer.getJimpFont(font);

        if (speed == null) {
            speed = 30;
        }

        let textWidth = Jimp.measureText(jimpFont, text);
        let textHeight = Jimp.measureTextHeight(jimpFont, text);
        if (width == null){
            width = this.buffer.image.bitmap.width - this.destX;
        } else {
            width = Math.min(this.buffer.image.bitmap.width - this.destX, width);
        }
        if (textWidth <= width){
            this.buffer.print(text, font, this.destX + (width - textWidth) / 2, this.destY);
            this.transform.transformScreen(this.buffer);
            return;
        }

        // pad the right side of the image by 4 pixels to add space when the text wraps arounnd
        let textImage = new Jimp(textWidth + 4, textHeight, Jimp.rgbaToInt(0, 0, 0, 255));
        textImage.print(jimpFont, 0, 0, { text: text, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, alignmentY: Jimp.VERTICAL_ALIGN_TOP });
        if (font.color)
        {
            let c = Jimp.rgbaToInt(font.color.red, font.color.green, font.color.blue, font.color.alpha);
            textImage.scan(0, 0, textWidth, textHeight, (x, y, idx) => {
                let p = textImage.getPixelColor(x, y);
                if (p > 0xFF){
                    textImage.setPixelColor((p & c) >>> 0, x, y);
                }
            });
        }
        this.scrollImage(textImage, speed, width, maxTime);
     }

     /**
      * Stop the scrolling
      */
     stop(){
        if (this.interval != null){
            clearInterval(this.interval);
            this.interval = null;
        }
     }
}

module.exports = HorizontalScroller;