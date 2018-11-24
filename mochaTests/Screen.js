"use strict"

/**
 * A simple frame buffer for testing.  Similar to the FrameBuffer class.
 * Supports getPixelColors for use with transforms.
 */
class Screen {

    constructor(xSize, ySize) {
        this.data = Screen.prototype.createArray.call(this, xSize, ySize);
    }

    //Returns a 3 element array containing RGB values
    getPixelColors(x, y) {
        return this.data[x][y];
    }

    setPixelColors(x, y, rgbArray) {
        this.data[x][y] = rgbArray;
    }

    createArray(xSize, ySize) {
        var result = [];
        for (var x = 0; x < xSize; ++x) {
            result[x] = [];
            for (var y = 0; y < ySize; ++y) {
                result[x][y] = [0, 0, 0];
            }
        }
        return result;
    }


    diagonalLine(x, y, size) {
        for (var i = 0; i < size; ++i) {
            this.setPixelColors(x + i, y + i, [255, 1, 1]);
        }
    }

    horizontalLine(yPosition, length) {
        for (var i = 0; i < length; ++i) {
            this.setPixelColors(i, yPosition, [255, 1, 1]);
        }
    }
}

exports.Screen = Screen;

