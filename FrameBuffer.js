"use strict";

const bytesPerPixel = 3; // RGB

const Color = require("./Color.js");

class FrameBuffer {

  constructor(width, height) {
    this.height = height;
    this.width = width;

    this.buffer = new Uint8Array(height*width*bytesPerPixel);

    this.on = false;
    this.dim = new Color(255, 255, 255);
    this.inverted = false;
  }

  getPixelIndex(x, y) {
    return ((y * this.width) + x) * bytesPerPixel;
  }

  getPixel(x, y) {
    // check pixel address
    if (x > this.width || y > this.height) {
      console.log("FrameBuffer::getPixel - invalid pixel address ", + x + ", " + y);
      return;
    }

    const pixelStartIndex = this.getPixelIndex(x, y);
    return new Color(this.buffer[pixelStartIndex],
                     this.buffer[pixelStartIndex + 1],
                     this.buffer[pixelStartIndex + 2]);
  }

  getPixelColors(x, y) {
    // check pixel address
    if (x > this.width || y > this.height) {
      console.log("FrameBuffer::getPixelColors - invalid pixel address " + x + ", " + y);
      return;
    }

    const pixelStartIndex = this.getPixelIndex(x, y);
    return [this.buffer[pixelStartIndex],
                     this.buffer[pixelStartIndex + 1],
                     this.buffer[pixelStartIndex + 2]];
  }

  clear() {
    this.buffer.fill(0x00);
  }

  setDisplayOn(on) {
    this.on = on ? true: false;
  }

  setInvert(invert) {
    this.invert = invert ? true: false;
  }

  // set dim factors
  // subtract values from pixel colors
  // 0, 0, 0 - no dimming
  // 255, 255, 255 - full dimming
  dim(color) {
    if (!color) {
      this.dim = null;
    } else if (color !== 'object') {
      console.log("FrameBuffer::dimDisplay - invalid pixel color");
    } else {
      this.dim = color;
    }
  }


  // draw a pixel
  drawPixel(x, y, color) {

    // if (color !== 'object') {
    //   console.log("FrameBuffer::setPixel - invalid pixel color")
    // };

    // check pixel address
    if (x > this.width || y > this.height) {
      console.log("FrameBuffer::setPixel - invalid pixel address " + x + ", " + y);
      return;
    }

    const pixelStartIndex = this.getPixelIndex(x, y);
    this.buffer[pixelStartIndex] = color.red;
    this.buffer[pixelStartIndex + 1] = color.green;
    this.buffer[pixelStartIndex + 2] = color.blue;

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
    const top = y + height -1;
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
    const top = y + height -1;
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

  scrollLeft() {

  }
  scrollRight() {

  }
}

module.exports = FrameBuffer;
