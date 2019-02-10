"use strict";

const axios = require('axios');
const FrameBuffer = require('./FrameBuffer.js');

/**
 * EmulatorTransform.js
 * This class will transform a screen buffer to data for the Emulator light display.
 * 
 */

class EmulatorTransform {

  get name() {
    return this._name;
  }
  /**
   * The  width of emulator in pixels
   */
  get width() {
    return this._width;
  }
  /**
   * The  height of emulator in pixels
   */
  get height() {
      return this._height;
  }
  get port() {
      return this._port;
  }

  /**
   * Use TransfomerFactory.getTransformer()
   */
  constructor(name, width, height, port ) {
    this._name = name;
    this._width = width;
    this._height = height;
    this._port = port;
  }

  close(){}

  transformScreen(screen){
    var buffer;
    if (screen instanceof FrameBuffer){
        buffer = screen.buffer;
    }
    else {
        buffer = new Uint8Array(this.width * this.height * 3);
        let index = 0;
        for (let y = 0; y < this.height; ++y){
            for (let x = 0; x < this.width; ++x){
                let c = screen.getPixelColors(x, y);
                buffer[index++] = c[0];
                buffer[index++] = c[1];
                buffer[index++] = c[2];
            }
        }
    }
    
    axios.post('http://localhost:' + this.port + '/screen', {
        data: buffer
    })
    .then((res) => {
      if (res.status != 200) {
        console.log(`status: ${res.status}`);
      }
    })
    .catch((error) => {
        console.error(error);
    });

  }
}

module.exports = EmulatorTransform;

