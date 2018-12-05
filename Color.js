"use strict";

class Color {
  constructor(red, green, blue, alpha = 255) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = alpha;
  }

  /**
   * Create a new Color instance from an RGB array
   * @param {Array number} rgb A three element array of RGB values
   */
  static fromRgb(rgb) {
    return new Color(rgb[0], rgb[1], rgb[2]);
  }

  get r() { return this.red; }
  get g() { return this.green; }
  get b() { return this.blue; }
  get a() { return this.alpha; }

  toInt(){
    return ((this.red << 24) | (this.green << 16) | (this.blue << 8) | this.alpha) >>> 0;
  }
}

module.exports = Color;
