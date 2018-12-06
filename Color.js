"use strict";

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
        this.alpha = 255;
    }
  }

  get r() { return this.red; }
  get g() { return this.green; }
  get b() { return this.blue; }
  get a() { return this.alpha; }
}

module.exports = Color; 
