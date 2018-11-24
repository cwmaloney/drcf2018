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

    static fromBitmapBuffer(buffer) {
        var instance = new BitmapBuffer();
        instance.image = buffer.image.clone();
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

    print2Lines(text1, text2, font1, font2) {
        if (font2 == null) {
            font2 = font1;
        }
        this.image.print(font1, 0, 0, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 
                    this.image.bitmap.width, this.image.bitmap.height / 2)
            .print(font2, 0, this.image.bitmap.height / 2, { text: text2, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
                    this.image.bitmap.width, this.image.bitmap.height / 2);
    }

    print1Line(text1, font1) {
        this.image.print(font1, 0, 0, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE },
                this.image.bitmap.width, this.image.bitmap.height);
    }

    //TODO: return a promise or take a callback or use async/await
    //  make it cancellable
    //  add support for 1 or 2 fixed lines
    //  add support for multiple lines scrolling?
    //  logic to detect if the line even needs scrolling
    //  break the scrolling logic out and make it reusable
    async print1LineScroll(text1, font1, transform,  speed, maxTime){
        if (maxTime == null) {
            maxTime = 600000; //10 minutes
        }
        if (speed == null) {
            speed = 30;
        }
        var textWidth = Jimp.measureText(font1, text1) + 4;
        var textHeight = Jimp.measureTextHeight(font1, text1) + 2;
        var textImage = new Jimp(textWidth, textHeight, Jimp.rgbaToInt(0, 0, 0, 255));
        textImage.print(font1, 2, 1, { text: text1, alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, alignmentY: Jimp.VERTICAL_ALIGN_TOP });
        
        var gzx = 0;
        var gzy = (this.image.bitmap.height / 2) - (textHeight / 2);
        var tix = 0;
        var tiy = 0;
        var b1width = Math.min(this.image.bitmap.width, textWidth - tix);
        var b2width = this.image.bitmap.width - b1width;
        this.image.blit(textImage, gzx, gzy, tix++, tiy, b1width, textHeight);
        transform.transformScreen(this);

        var interval = setInterval(() => {
            maxTime -= speed;
            if (maxTime < 0){
                clearInterval(interval)
            }
            b1width = Math.min(this.image.bitmap.width, textWidth - tix);
            b2width = this.image.bitmap.width - b1width;
            this.image.blit(textImage, gzx, gzy, tix++, tiy, b1width, textHeight);
            if (b2width > 0){
                this.image.blit(textImage, b1width, gzy, 0, tiy, b2width, textHeight);
            }
            
            transform.transformScreen(this);

            if (tix > textWidth) {
                tix = 0;
            }
        }, speed);
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

