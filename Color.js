"use strict";

class Color {
  constructor(red, green, blue, alpha = 255) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = 255;
  }

  get r() { return this.red; }
  get g() { return this.green; }
  get b() { return this.blue; }
  get a() { return this.alpha; }
}

module.exports = Color;
