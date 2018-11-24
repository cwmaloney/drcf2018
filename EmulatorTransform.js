"use strict";

const axios = require('axios');
const FrameBuffer = require('./FrameBuffer.js');

/**
 * EmulatorTransform.js
 * This class will transform a screen buffer to data for the Emulator light display.
 * 
 */

class EmulatorTransform {

    static get width() {
        return 168;
    }
    static get height() {
        return 36;
    }

    constructor() {
    }

    close(){}

    transformScreen(screen){
        var buffer;
        if (screen instanceof FrameBuffer){
            buffer = screen.buffer;
        }
        else {
            buffer = new Uint8Array(EmulatorTransform.width * EmulatorTransform.height * 3);
            let index = 0;
            for (let y = 0; y < EmulatorTransform.height; ++y){
                for (let x = 0; x < EmulatorTransform.width; ++x){
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
<<<<<<< HEAD
            //console.log(`status: ${res.status}`)
=======
          if (res.status != 200) {
            console.log(`status: ${res.status}`);
          }
>>>>>>> 132c8e1a9d4268189ac63cc9f17faf4116c698bf
        })
        .catch((error) => {
            console.error(error);
        });

    }
}

module.exports = EmulatorTransform;

