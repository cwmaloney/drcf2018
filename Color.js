"use strict";

class Color {
  constructor(red, green, blue) {
    this.red = red;
    this.green = green;
    this.blue = blue;
  }

  get r() { return this.red; };
  get g() { return this.green; };
  get b() { return this.blue; };
}

module.exports = Color;
