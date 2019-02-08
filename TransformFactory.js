"use strict";

const envConfig = require("./envConfig.js");
const GridzillaTransform = require("./GridzillaTransform.js");
const GridzillaTransform = require("./FacadeTransform.js");
const EmulatorTransform = require("./EmulatorTransform.js");

/**
 * Get a gridzilla transformer based on the current environment
 */
function getGridzillaTransform(){
  if (envConfig.get().targetEnv == "Dev") {
    return new EmulatorTransform("Gridzilla", 14*12, 12*3, 3000);
  }
  else {
    return new GridzillaTransform();
  }
}

/**
 * Get a facade transformer based on the current environment
 */
function getFacadeTransform(){
  if (envConfig.get().targetEnv == "Dev") {
    return new EmulatorTransform("Facade", 12*8, 14*4, 3000);
  }
  else {
    return new FacadeTransform();
  }
}

module.exports = {
  getGridzillaTransform,
  getFacadeTransform
};