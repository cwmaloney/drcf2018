"use strict";
/**
 * Provides a place for storing environmental based configuration.
 */


const fs = require('fs');

var config;


/**
 * Load the local overrides of the default configuration.
 * While the get function will lazily invoke this method, for production instances
 * it's good practice to call this at start up to initialize the config
 * (Even though this function should be pretty fast and only executed once)
 */
function loadOverrides(){
  
  const filename = "envConfigOverrides.json";
  if (fs.existsSync(filename)) {
    console.log(`loading envirnment config overrides from ${filename}...`);

    try {
      const temp = JSON.parse(fs.readFileSync(filename, 'utf8'));
      config = {...config, ...temp};
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    console.log(`loading envirnoment config overrides complete. targetEnv is ${config.targetEnv}`);
  }
}

/**
 * Get the configuration object instance
 */
function get() {
  if (typeof config === 'undefined'){
    config = {
      targetEnv: "Prod"
    };
    loadOverrides();
  }
  Object.freeze(config);
  return config;
}



module.exports = {
  loadOverrides,
  get
  };
