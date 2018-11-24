"use strict";

const Jimp = require('jimp');

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

     /**
      * Scrolls the supplied image on the destination
      * @param {Jimp} image The sorce image to scroll
      * @param {number} [30] speed The speed to scroll at, in ms between refreshes
      * @param {number} [max available or max of the source] width  
      * How much of the source image to show, use to crop the source image, a value larger than the source image will be ignored
      * @param {number} [300000] maxTime maximum time to scroll
      */
     async scrollImage(image, speed, width, maxTime){
        this.stop();
        if (maxTime == null) {
            maxTime = 300000; //5 minutes
        }
        if (speed == null) {
            speed = 30;
        }
        if (width == null){
            width = Math.min(image.bitmap.width, this.buffer.image.bitmap.width - this.destX);
        } else {
            width = Math.min(image.bitmap.width, this.buffer.image.bitmap.width - this.destX, width);
        }
        var srcWidth = image.bitmap.width;
        var srcHeight = image.bitmap.height;
        var srcX = 0;
        var srcY = 0;
        var blit1width = Math.min(width, srcWidth - srcX);
        var blit2width = width - blit1width;
        this.buffer.image.blit(image, this.destX, this.destY, srcX++, srcY, blit1width, srcHeight);
        this.transform.transformScreen(this.buffer);

        this.interval = setInterval(() => {
            maxTime -= speed;
            if (maxTime < 0){
                this.stop();
            }
            blit1width = Math.min(width, srcWidth - srcX);
            blit2width = width - blit1width;
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
      * @param {number} [30] speed The speed to scroll at, in ms between refreshes
      * @param {number} [max available or max of the source] width  
      * How much of the source image to show, use to crop the source image, a value larger than the source image will be ignored
      * @param {number} [300000] maxTime maximum time to scroll
      */
     async scrollBuffer(buffer, speed, width, maxTime){
        this.scrollImage(buffer.image, speed, width, maxTime);
     }

    /**
      * Scrolls the supplied text on the destination
      * @param {string} text The text to scroll
      * @param {Jimp.Font} font The font to use
      * @param {number} [30] speed The speed to scroll at, in ms between refreshes
      * @param {number} [max available or max of the source] width  
      * How much of the source text to show, use to limit the right boundry of the scrolling area
      * @param {number} [300000] maxTime maximum time to scroll
      */
     async scrollText(text, font, speed, width, maxTime){
        // pad the left and the right of the string by 2 pixels
        var textWidth = Jimp.measureText(font, text) + 4;
        // pad the top and the bottom of the string by 1 pixel
        var textHeight = Jimp.measureTextHeight(font, text) + 2;
        var textImage = new Jimp(textWidth, textHeight, Jimp.rgbaToInt(0, 0, 0, 255));
        //offset by x=2 and y=1 to achieve the desired padding
        textImage.print(font, 2, 1, { text: text, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, alignmentY: Jimp.VERTICAL_ALIGN_TOP });
        
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