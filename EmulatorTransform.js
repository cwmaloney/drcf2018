"use strict";

const axios = require('axios');

/**
 * EmulatorTransform.js
 * This class will transform a screen buffer to data for the Emulator light display.
 * 
 */

class EmulatorTransform {

    constructor() {
    }

    transformScreen(screen){
        axios.post('http://localhost:3000/screen', {
            data: screen.buffer
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

