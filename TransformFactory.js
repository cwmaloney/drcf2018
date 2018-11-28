"use strict";

const envConfig = require("./envConfig.js");
const GridzillaTransform = require("./GridzillaTransform.js");
const EmulatorTransform = require("./EmulatorTransform.js");

/**
 * Get a screen transformer based on the current environment
 */
function getTransform(){
    if (envConfig.get().targetEnv == "Dev") {
        return new EmulatorTransform();
    }
    // else if (envConfig.get().targetEnv == "Test") {
    //     return new EmulatorTransform();
    // }
    else {
        return new GridzillaTransform();
    }
}

module.exports = {
    getTransform
    };