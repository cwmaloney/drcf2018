"use strict";

const tinycolor = require('tinycolor2');


class Color {
  constructor(red, green, blue, alpha = 255) {
    if (Array.isArray(red)) {
      this.red = red[0];
      this.green = red[1];
      this.blue = red[2];
      if (red.length > 3) {
        this.alpha = red[3];
      } else {
        this.alpha = 255;
      }
    } else if (typeof red == "object") {
      this.red = red.red;
      this.green = red.green;
      this.blue = red.blue;
      if (red.alpha) {
        this.alpha = red.alpha;
      } else {
        this.alpha = 255;
      }
    } else {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha;
    }
  }

  /**
   * Create a new Color instance from an RGB array
   * @param {Array number} rgb A three element array of RGB values
   */
  static fromRgb(rgb) {
    return new Color(rgb[0], rgb[1], rgb[2]);
  }


  static createTinyColor(color) {
    return new tinycolor( { r: color.red, g: color.green, b: color.blue, a: color.alpha} );
  }

  static fromTinyColor(tinyColor) {
    const rgb = tinyColor.toRgb();
    return new Color( { red: rgb.r, green: rgb.g, blue: rgb.b, alpha: rgb.a*255 } );
  }

  static adjustColor(color, gray) {
    const c = Color.createTinyColor(color);
    const g = Color.createTinyColor(gray);
    const cHsl = c.toHsl();
    const gHsl = g.toHsl();
    const adjusted = new tinycolor( { h:cHsl.h, s:cHsl.s, l: (cHsl.l * gHsl.l), a:gHsl.a} );
    return Color.fromTinyColor(adjusted);
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
