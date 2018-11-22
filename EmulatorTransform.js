"use strict";

const axios = require('axios');
const FrameBuffer = require('./FrameBuffer.js');

/**
 * EmulatorTransform.js
 * This class will transform a screen buffer to data for the Emulator light display.
 * 
 */

class EmulatorTransform {

    static width = 168;
    static height = 36;

    constructor() {
    }

    transformScreen(screen){
        var buffer;
        if (screen instanceof FrameBuffer){
            buffer = screen.buffer;
        }
        else {
            //TODO: remove hard coded sizes
            buffer = new Uint8Array(width * height * 3);
            let index = 0;
            for (let y = 0; y < height; ++y){
                for (let x = 0; x < width; ++x){
                    let c = screen.getPixelColors(x, y);
                    buffer[index++] = c[0];
                    buffer[index++] = c[1];
                    buffer[index++] = c[2];
                }
            }
        }
        
        axios.post('http://localhost:3000/screen', {
            data: buffer
        })
        .then((res) => {
            console.log(`status: ${res.status}`)
        })
        .catch((error) => {
            console.error(error)
        });

    }
}

module.exports = EmulatorTransform;

