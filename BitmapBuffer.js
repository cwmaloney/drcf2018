"use strict";

const Jimp = require('jimp');
const Color = require('./Color.js');

/**
 * BitmapBuffer.js
 * A simple wrapper around a Jimp bitmap.
 * 
 */

class BitmapBuffer {

    constructor() {
    }

    static fromImage(image) {
        var instance = new BitmapBuffer();
        instance.image = image; //Jimp image
        return instance;
    }

    static fromNew(x, y, color = new Color(0, 0, 0)) {
        var instance = new BitmapBuffer();
        instance.image = new Jimp(x, y, Jimp.rgbaToInt(color.red, color.green, color.blue, color.alpha));
        return instance;
    }

    //TODO: fromPath take a path to an image and open the file and read it, that would have to be async

    /**
     * Retuns the RGB values in a 3 element array.  This is the method used by transforms.
     * @param {*} x The x coordinate 
     * @param {*} y The y coordinate
     */
    getPixelColors(x, y) {
        let rgba = Jimp.intToRGBA(this.image.getPixelColor(x, y));
        return [rgba.r, rgba.g, rgba.b];
    }

    drawPixel(x, y, color) {

        // if (color !== 'object') {
        //   console.log("FrameBuffer::setPixel - invalid pixel color")
        // };

        // check pixel address
        if (x > this.image.bitmap.width || y > this.image.bitmap.height) {
            console.log("FrameBuffer::setPixel - invalid pixel address " + x + ", " + y);
            return;
        }

        // const pixelStartIndex = jimp.getPixelIndex(x, y);
        this.image.setPixelColor(Jimp.rgbaToInt(color.red, color.green, color.blue, color.alpha), x, y)

        // console.log("FrameBuffer::drawPixel(", x, y, ")", " r=", color.red, " g=", color.green, " b=", color.blue)
    }


    // draw a line
    // This uses use Bresenham's line algorithm.
    drawLine(x0, y0, x1, y1, color) {
        const deltaX = Math.abs(x1 - x0);
        const deltaY = Math.abs(y1 - y0);
        const signX = x0 < x1 ? 1 : -1;
        const signY = y0 < y1 ? 1 : -1;

        var err = ((deltaX > deltaY) ? deltaX : -deltaY) / 2;
        var x = x0;
        var y = y0;

        this.drawPixel(x, y, color);
        while (!(x === x1 && y === y1)) {
            const lastErr = err;

            if (lastErr > -deltaX) {
                err -= deltaY;
                x += signX;
            }
            if (lastErr < deltaY) {
                err += deltaX;
                y += signY;
            }
            this.drawPixel(x, y, color);
        }

    }

    // draw a rectangle outline
    drawRect(x, y, width, height, color) {
        const left = x;
        const top = y;
        const bottom = y + height - 1;
        const right = x + width - 1;

        //bottom
        this.drawLine(left, bottom, right, bottom, color);

        //right
        this.drawLine(right, bottom, right, top, color);

        //top
        this.drawLine(right, top, left, top, color);

        //left
        this.drawLine(left, top, left, bottom, color);
    }

    // draw a filled rectangle 
    fillRect(x, y, width, height, color) {
        const left = x;
        const bottom = y;
        const top = y + height - 1;
        const right = x + width - 1;

        // draw horizonal lines to fill rectangle
        for (var row = bottom; row <= top; row += 1) {
            this.drawLine(left, row, right, row, color);
        }
    }


    /**
     * draw a circle outline, with center x, y, and radius r
     */
    // This uses use Bresenham's line algorithm.
    drawCircle(x0, y0, radius, color) {
        radius = Math.abs(radius);

        // draw the bounding points
        this.drawPixel(x0, y0 + radius, color);
        this.drawPixel(x0, y0 - radius, color);
        this.drawPixel(x0 + radius, y0, color);
        this.drawPixel(x0 - radius, y0, color);

        var radiusError = 1 - radius;
        var deltaX = 1;
        var deltaY = -2 * radius;

        var x = 0;
        var y = radius;

        while (x < y) {
            if (radiusError >= 0) {
                y--;
                deltaY += 2;
                radiusError += deltaY;
            }
            x++;
            deltaX += 2;
            radiusError += deltaX;

            this.drawPixel(x0 + x, y0 + y, color);
            this.drawPixel(x0 - x, y0 + y, color);
            this.drawPixel(x0 + x, y0 - y, color);
            this.drawPixel(x0 - x, y0 - y, color);
            this.drawPixel(x0 + y, y0 + x, color);
            this.drawPixel(x0 - y, y0 + x, color);
            this.drawPixel(x0 + y, y0 - x, color);
            this.drawPixel(x0 - y, y0 - x, color);
        }
    }

    /**
     * Standard fill changes all pixels of the same color as the starting pixel,
     * to a new color within a region bounded by any other color not equal to the starting pixel color
     * @param {number} x Where to start the fill
     * @param {number} y Where to start the fill
     * @param {Color} color The color to fill
     */
    fill(x, y, color) {
        const currentColor = this.image.getPixelColor(x, y);
        if (Jimp.rgbaToInt(color.red, color.green, color.blue, color.alpha) == currentColor){
            return;
        }
        this.image.setPixelColor(Jimp.rgbaToInt(color.red, color.green, color.blue, color.alpha), x, y);
       
        if (y > 0 && this.image.getPixelColor(x, y - 1) == currentColor) {
            this.fill(x, y - 1, color);
        }
        if (x < this.image.bitmap.width - 1 && this.image.getPixelColor(x + 1, y) == currentColor) {
            this.fill(x + 1, y, color);
        }
        if (y < this.image.bitmap.height - 1 && this.image.getPixelColor(x, y + 1) == currentColor) {
            this.fill(x, y + 1, color);
        }
        if (x > 0 && this.image.getPixelColor(x - 1, y) == currentColor) {
            this.fill(x - 1, y, color);
        }
    }


    /**
     * Swap all pixels of color c1 to color c2
     * @param {Color} c1 The original color
     * @param {Color} c2 The replacement color
     */
    switchColor(c1, c2){
        let c1h = Jimp.rgbaToInt(c1.red, c1.green, c1.blue, c1.alpha);
        this.image.scan(0, 0, this.image.bitmap.width, this.image.bitmap.height, (x, y, idx) => {
            if (this.image.getPixelColor(x, y) == c1h) {
                let replacementColor = c2;
                if (Array.isArray(c2)) {
                    replacementColor = c2[Math.floor(Math.random() * c2.length)];
                }
                this.image.bitmap.data[idx] = replacementColor.red;
                this.image.bitmap.data[idx + 1] = replacementColor.green;
                this.image.bitmap.data[idx + 2] = replacementColor.blue;
                this.image.bitmap.data[idx + 3] = replacementColor.alpha;
            }
        });
    }

    /**
     * Blit an image on to this buffer
     * @param {Jimp} srcImage The source image to blit on to this buffer
     * @param {number} x  Where to place the image on this buffer
     * @param {number} y Where to place the image on this buffer
     * @param {number} width [max available or max of the source]
     * How much of the source image to show, use to crop the source image, a value larger than the source image will be ignored
     * @param {number} height [max available or max of the source]
     * How much of the source image to show, use to crop the source image, a value larger than the source image will be ignored
     */
    blit(srcImage, x, y, width, height){
        if (width == null){
            width = Math.min(srcImage.bitmap.width, this.image.bitmap.width - x);
        } else {
            width = Math.min(srcImage.bitmap.width, this.image.bitmap.width - x, width);
        }
        if (height == null){
            height = Math.min(srcImage.bitmap.height, this.image.bitmap.height - y);
        } else {
            height = Math.min(srcImage.bitmap.height, this.image.bitmap.height - y, height);
        }
        this.image.blit(srcImage, x, y, 0, 0, width, height);
    }

    /**
     * Convience method to print three lines of text centered on the screen
     * @param {string} text1 line 1
     * @param {string} text2 line 2
     * @param {string} text3 line 3
     * @param {Font} font1 line 1 font
     * @param {Font} [font1] font2 line 2 font
     * @param {Font} [font1] font3 line 3 font 
     */
    print3Lines(text1, text2, text3, font1, font2, font3) {
        if (font2 == null) {
            font2 = font1;
        }
        if (font3 == null) {
            font3 = font1;
        }

        this.print(text1, font1, this.getXCentered(text1, font1), 0);
        this.print(text2, font2, this.getXCentered(text2, font2), this.image.bitmap.height / 3);
        this.print(text3, font3, this.getXCentered(text3, font3), (this.image.bitmap.height / 3) * 2);
    }

    /**
     * Convience method to print two lines of text centered on the screen
     * @param {string} text1 line 1
     * @param {string} text2 line 2
     * @param {Font} font1 line 1 font
     * @param {Font} font2 [font1] line 2 font
     */
    print2Lines(text1, text2, font1, font2) {
        if (font2 == null) {
            font2 = font1;
        }
        this.print(text1, font1, this.getXCentered(text1, font1), 0);
        this.print(text2, font2, this.getXCentered(text2, font2), this.image.bitmap.height / 2);
    }

    /**
     * Convience method to print one line of text centered on the screen
     * @param {string} text Text to print
     * @param {Font} font Font to use
     * @param {number} y [null for vertically centered] y position or null for vertically centered
     */
    print1Line(text, font, y) {
        if (y == null) {
            this.print(text, font, this.getXCentered(text, font), this.getYCentered(text, font));
        }
        else {
            this.print(text, font, this.getXCentered(text, font), y);
        }
    }

    getXCentered(text, font) {
        let width = Jimp.measureText(BitmapBuffer.getJimpFont(font), text);
        return this.image.bitmap.width / 2 - width / 2;
    }

    getYCentered(text, font) {
        var height = Jimp.measureTextHeight(BitmapBuffer.getJimpFont(font), text);
        return this.image.bitmap.height / 2 - height / 2;
    }

    static getJimpFont(font) {
      const size = font.size;

      let adjustedSize = size;
      if (size < 8) {
        adjustedSize = 8;
      }
      else if (size > 18) {
        adjustedSize = 18;
      }

      // if (size < 8) {
      //   adjustedSize = 8;
      // }
      // else if (size < 20) {
      //   adjustedSize = size;
      // }
      // else if (size <= 22) {
      //   adjustedSize = 22;
      // }
      // else if (size <= 24) {
      //   adjustedSize = 22;
      // }
      // else if (size <= 32) {
      //   adjustedSize = 22;
      // }
      // else {
      //   adjustedSize = 34;
      // }

      return BitmapBuffer.defaultFonts[adjustedSize - 8];
    }

    /**
     * Print text at an exact coordinate
     * @param {string} text the text to print
     * @param {Jimp.Font} font The font to use
     * @param {number} x Where to print
     * @param {number} y Where to print
     */
    print(text, font, x = 0, y = 0) {
      const jimpFont = BitmapBuffer.getJimpFont(font);
      const textWidth = Jimp.measureText(jimpFont, text);
      const textHeight = Jimp.measureTextHeight(jimpFont, text);

      let textImage = new Jimp(textWidth, textHeight, Jimp.rgbaToInt(0, 0, 0, 255));        
      textImage.print(jimpFont, 0, 0, { text: text, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, alignmentY: Jimp.VERTICAL_ALIGN_TOP });   
      if (font.color)
      {
        textImage.scan(0, 0, textWidth, textHeight, (x, y, idx) => {
            const red     = textImage.bitmap.data[idx + 0];
            const green   = textImage.bitmap.data[idx + 1];
            const blue    = textImage.bitmap.data[idx + 2];
            const alpha   = textImage.bitmap.data[idx + 3];
          if (red !== 0 && green !== 0 &&  blue !==0) { 
            const adjusted = Color.adjustColor(font.color, new Color( { red, green, blue, alpha }));
            textImage.setPixelColor(Jimp.rgbaToInt(adjusted.red, adjusted.green, adjusted.blue, adjusted.alpha), x, y);
          }
        });
      }
      this.image.blit(textImage, x, y, 0, 0, textWidth, textHeight);

      return [textWidth, textHeight];
    }

    static initializeFonts(){
      var promises = [
        Jimp.loadFont("fonts/litteraWhite8.fnt"),
        Jimp.loadFont("fonts/litteraWhite9.fnt"),
        Jimp.loadFont("fonts/litteraWhite10.fnt"),
        Jimp.loadFont("fonts/litteraWhite11.fnt"),
        Jimp.loadFont("fonts/litteraWhite12.fnt"),
        Jimp.loadFont("fonts/litteraWhite13.fnt"),
        Jimp.loadFont("fonts/litteraWhite14.fnt"),
        Jimp.loadFont("fonts/litteraWhite15.fnt"),
        Jimp.loadFont("fonts/litteraWhite16.fnt"),
        Jimp.loadFont("fonts/litteraWhite17.fnt"),
        Jimp.loadFont("fonts/litteraWhite18.fnt")
      ];
      // var promises = [
      //   Jimp.loadFont("fonts/opensans-8.fnt"),
      //   Jimp.loadFont("fonts/opensans-9.fnt"),
      //   Jimp.loadFont("fonts/opensans-10.fnt"),
      //   Jimp.loadFont("fonts/opensans-11.fnt"),
      //   Jimp.loadFont("fonts/opensans-12.fnt"),
      //   Jimp.loadFont("fonts/opensans-13.fnt"),
      //   Jimp.loadFont("fonts/opensans-14.fnt"),
      //   Jimp.loadFont("fonts/opensans-15.fnt"),
      //   Jimp.loadFont("fonts/opensans-16.fnt"),
      //   Jimp.loadFont("fonts/opensans-17.fnt"),
      //   Jimp.loadFont("fonts/opensans-18.fnt"),
      //   Jimp.loadFont("fonts/opensans-19.fnt"),
      //   Jimp.loadFont("fonts/opensans-20.fnt"),
      //   Jimp.loadFont("fonts/opensans-22.fnt"),
      //   Jimp.loadFont("fonts/opensans-24.fnt"),
      //   Jimp.loadFont("fonts/opensans-32.fnt"),
      //   Jimp.loadFont("fonts/opensans-34.fnt")
      // ];
      
      var resultPromise = Promise.all(promises);
      resultPromise.then( (results) => {
          BitmapBuffer.defaultFonts = results;
      });

      return resultPromise;
    }
}


module.exports = BitmapBuffer;

