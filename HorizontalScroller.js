"use strict";

const Jimp = require('jimp');

class HorizontalScroller{
    /**
     * Things I need:
     * x,y position
     * width (assume the height is the height of the text)
     * bitmap buffer to print on
     * transform to refresh
     * 
     * Things I do:
     * start scrolling text
     *   OR
     * start scrolling an image
     * stop scrolling
     */

         //TODO: 
    //  break the scrolling logic out and make it reusable for images


     constructor(x, y, width, buffer, transform){
        this.destX = x;
        this.destY = y;
        this.width = width;
        this.buffer = buffer;
        this.transform = transform;
     }

     async scrollText(text, font, speed, maxTime){
        this.stop();
        if (maxTime == null) {
            maxTime = 300000; //5 minutes
        }
        if (speed == null) {
            speed = 30;
        }

        // pad the left and the right of the string by 2 pixels
        var textWidth = Jimp.measureText(font, text) + 4;
        // pad the top and the bottom of the string by 1 pixel
        var textHeight = Jimp.measureTextHeight(font, text) + 2;
        var textImage = new Jimp(textWidth, textHeight, Jimp.rgbaToInt(0, 0, 0, 255));
        //offset by x=2 and y=1 to achieve the desired padding
        textImage.print(font, 2, 1, { text: text, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, alignmentY: Jimp.VERTICAL_ALIGN_TOP });
        
        var srcX = 0;
        var srcY = 0;
        var blit1width = Math.min(this.width, textWidth - srcX);
        var blit2width = this.width - blit1width;
        this.buffer.image.blit(textImage, this.destX, this.destY, srcX++, srcY, blit1width, textHeight);
        this.transform.transformScreen(this.buffer);

        this.interval = setInterval(() => {
            maxTime -= speed;
            if (maxTime < 0){
                this.stop();
            }
            blit1width = Math.min(this.width, textWidth - srcX);
            blit2width = this.width - blit1width;
            this.buffer.image.blit(textImage, this.destX, this.destY, srcX++, srcY, blit1width, textHeight);
            if (blit2width > 0){
                this.buffer.image.blit(textImage, this.destX + blit1width, this.destY, 0, srcY, blit2width, textHeight);
            }
            
            this.transform.transformScreen(this.buffer);

            if (srcX > textWidth) {
                srcX = 0;
            }
        }, speed);
     }

     stop(){
        if (this.interval != null){
            clearInterval(this.interval);
            this.interval = null;
        }
     }
}

module.exports = HorizontalScroller;