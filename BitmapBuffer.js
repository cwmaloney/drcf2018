"use strict";

const Jimp = require('jimp');


/**
 * BitmapBuffer.js
 * A simple wrapper around a Jimp bitmap.
 * 
 */

class BitmapBuffer {

    // static LITTERA_BLACK_11 = null;
    // static LITTERA_BLACK_16 = null;
    // static LITTERA_WHITE_11 = null;
    // static LITTERA_WHITE_16 = null;
    // static LITTERA_RED_11 = null;
    // static LITTERA_RED_16 = null;
    // static LITTERA_BLUE_11 = null;
    // static LITTERA_BLUE_16 = null;
    // static LITTERA_GREEN_11 = null;
    // static LITTERA_GREEN_16 = null;
    // static JIMP_WHITE_16 = null;

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

    //TODO: fromPath take a path to an image and open the file and read it

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

    print3Lines(text1, text2, text3, font) {
        //        var promise = Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
        // var promise = Jimp.loadFont("fonts/litteraYellow11.fnt");

        // promise.then(font => {
        this.image.print(font, 0, 0, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 168, 12)
            .print(font, 0, 12, { text: text2, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 168, 12)
            .print(font, 0, 24, { text: text3, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 168, 12);
        // }
        // );

        // return promise;
    }

    print2Lines(text1, text2, font) {
        this.image.print(font, 0, 0, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 168, 18)
            .print(font, 0, 18, { text: text2, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 168, 18);
    }

    print1Line(text1, font) {
        this.image.print(font, 0, 0, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 168, 36);
    }

    static initializeFonts(){
        var promises = [Jimp.loadFont("fonts/litteraBlack11.fnt"), Jimp.loadFont("fonts/litteraBlack16.fnt"), Jimp.loadFont("fonts/litteraWhite11.fnt"),
                Jimp.loadFont("fonts/litteraWhite16.fnt"), Jimp.loadFont("fonts/litteraRed11.fnt"), Jimp.loadFont("fonts/litteraRed16.fnt"),
                Jimp.loadFont("fonts/litteraBlue11.fnt"), Jimp.loadFont("fonts/litteraBlue16.fnt"), Jimp.loadFont("fonts/litteraGreen11.fnt"),
                Jimp.loadFont("fonts/litteraGreen16.fnt"), Jimp.loadFont("fonts/litteraYellow11.fnt"), Jimp.loadFont("fonts/litteraYellow16.fnt")];

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
        });

        return resultPromise;
    }
}



module.exports = BitmapBuffer;

