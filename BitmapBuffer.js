"use strict";

const Jimp = require('jimp');


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

    static fromNew(x, y, color) {
        var instance = new BitmapBuffer();
        instance.image = new Jimp(x, y, Jimp.rgbaToInt(color.red, color.green, color.blue, 255));
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
        this.image.setPixelColor(Jimp.rgbaToInt(color.red, color.green, color.blue, 255), x, y)

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
        const bottom = y;
        const top = y + height - 1;
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
     * Swap all pixels of color c1 to color c2
     * @param {Color} c1 The original color
     * @param {Color} c2 The replacement color
     */
    switchColor(c1, c2){
        for (let i = 0; i < this.image.bitmap.data.length; i = i + 4) {
            if (this.image.bitmap.data[i] == c1.red && this.image.bitmap.data[i+1] == c1.green && this.image.bitmap.data[i+2] == c1.blue) {
                let replacementColor = c2;
                if (Array.isArray(c2)){
                    replacementColor = c2[Math.floor(Math.random() * c2.length)];
                }
                this.image.bitmap.data[i] = replacementColor.red;
                this.image.bitmap.data[i+1] = replacementColor.green;
                this.image.bitmap.data[i+2] = replacementColor.blue;
            }
        }
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
     * @param {Jimp.Font} font1 line 1 font
     * @param {Jimp.Font} [font1] font2 line 2 font
     * @param {Jimp.Font} [font1] font3 line 3 font 
     */
    print3Lines(text1, text2, text3, font1, font2, font3) {
        if (font2 == null) {
            font2 = font1;
        }
        if (font3 == null) {
            font3 = font1;
        }
        this.image.print(font1, 0, 0, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
                    this.image.bitmap.width, this.image.bitmap.height / 3)
            .print(font2, 0, 12, { text: text2, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 
                    this.image.bitmap.width, this.image.bitmap.height / 3)
            .print(font3, 0, 24, { text: text3, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 
                    this.image.bitmap.width, this.image.bitmap.height / 3);
    }

    /**
     * Convience method to print two lines of text centered on the screen
     * @param {string} text1 line 1
     * @param {string} text2 line 2
     * @param {Jimp.Font} font1 line 1 font
     * @param {Jimp.Font} font2 [font1] line 2 font
     */
    print2Lines(text1, text2, font1, font2) {
        if (font2 == null) {
            font2 = font1;
        }
        this.image.print(font1, 0, 0, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 
                    this.image.bitmap.width, this.image.bitmap.height / 2)
            .print(font2, 0, this.image.bitmap.height / 2, { text: text2, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
                    this.image.bitmap.width, this.image.bitmap.height / 2);
    }

    /**
     * Convience method to print one line of text centered on the screen
     * @param {string} text1 line 1
     * @param {Jimp.Font} font1 line 1 font
     * @param {number} y [null for vertically centered] y position or null for vertically centered
     */
    print1Line(text1, font1, y) {
        if (y == null) {
            this.image.print(font1, 0, 0, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
                    this.image.bitmap.width, this.image.bitmap.height);
        }
        else {
            this.image.print(font1, 0, y, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_TOP },
                this.image.bitmap.width, this.image.bitmap.height);
        }
    }

    /**
     * Print text at an exact coordinate
     * @param {string} text1 the text to print
     * @param {Jimp.Font} font1 The font to use
     * @param {number} x Where to print
     * @param {number} y Where to print
     */
    print(text1, font1, x, y) {
        var text1Width = Jimp.measureText(font1, text1);
        var text1Height = Jimp.measureTextHeight(font1, text1);

        if (x == null) {
            x = 0;
        }
        if (y == null) {
            y = 0;
        }
        //If you tell Jimp to print with the exact width, it will wrap, maybe there is an error in their lenght calculation
        //Addint 4 seems to be enough to get the correct behavior
        var width = text1Width + 4;
        
        this.image.print(font1, x, y, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, alignmentY: Jimp.VERTICAL_ALIGN_TOP },
                width, text1Height);

        return [width, text1Height];
    }

    static initializeFonts(){
        var promises = [Jimp.loadFont("fonts/litteraBlack11.fnt"), Jimp.loadFont("fonts/litteraBlack16.fnt"), Jimp.loadFont("fonts/litteraWhite11.fnt"),
                Jimp.loadFont("fonts/litteraWhite16.fnt"), Jimp.loadFont("fonts/litteraRed11.fnt"), Jimp.loadFont("fonts/litteraRed16.fnt"),
                Jimp.loadFont("fonts/litteraBlue11.fnt"), Jimp.loadFont("fonts/litteraBlue16.fnt"), Jimp.loadFont("fonts/litteraGreen11.fnt"),
                Jimp.loadFont("fonts/litteraGreen16.fnt"), Jimp.loadFont("fonts/litteraYellow11.fnt"), Jimp.loadFont("fonts/litteraYellow16.fnt"),

                Jimp.loadFont("fonts/litteraPink11.fnt"), Jimp.loadFont("fonts/litteraPink16.fnt"), Jimp.loadFont("fonts/litteraPurple11.fnt"),
                Jimp.loadFont("fonts/litteraPurple16.fnt"), Jimp.loadFont("fonts/litteraTeal11.fnt"), Jimp.loadFont("fonts/litteraTeal16.fnt"),
                Jimp.loadFont("fonts/litteraOrange11.fnt"), Jimp.loadFont("fonts/litteraOrange16.fnt")];

        var resultPromise = Promise.all(promises);
        resultPromise.then( (results) => {
            BitmapBuffer.LITTERA_BLACK_11 = results[0];
            BitmapBuffer.LITTERA_BLACK_16 = results[1];
            BitmapBuffer.LITTERA_WHITE_11 = results[2];
            BitmapBuffer.LITTERA_WHITE_16 = results[3];
            BitmapBuffer.LITTERA_RED_11 = results[4];
            BitmapBuffer.LITTERA_RED_16 = results[5];
            BitmapBuffer.LITTERA_BLUE_11 = results[6];
            BitmapBuffer.LITTERA_BLUE_16 = results[7];
            BitmapBuffer.LITTERA_GREEN_11 = results[8];
            BitmapBuffer.LITTERA_GREEN_16 = results[9];
            BitmapBuffer.LITTERA_YELLOW_11 = results[10];
            BitmapBuffer.LITTERA_YELLOW_16 = results[11];
            BitmapBuffer.LITTERA_PINK_11 = results[12];
            BitmapBuffer.LITTERA_PINK_16 = results[13];
            BitmapBuffer.LITTERA_PURPLE_11 = results[14];
            BitmapBuffer.LITTERA_PURPLE_16 = results[15];
            BitmapBuffer.LITTERA_TEAL_11 = results[16];
            BitmapBuffer.LITTERA_TEAL_16 = results[17];
            BitmapBuffer.LITTERA_ORANGE_11 = results[18];
            BitmapBuffer.LITTERA_ORANGE_16 = results[19];
        });

        return resultPromise;
    }
}


module.exports = BitmapBuffer;

