"use strict";

const fs = require('fs');

const { FileUtilities } = require("./FileUtilities.js");
const { Secrets } = require("./secrets.js");

const censusNamesFileName = 'censusNames.txt';
const additionalNamesFileName = 'additionalNames.txt';

class NameManager {

  constructor() {
    this.censusNames = new Map();
    this.additionalNames = new Map();
  }

  isNameValid(name) {
    return (this.additionalNames.get(name) !== undefined)
            || (this.censusNames.get(name) !== undefined);
  }

  addNameToAdditionalNames(name) {
    if (this.isNameValid(name) === false) {
      this.additionalNames.set(name, this.additionalNames.size);
      this.writeAdditionalNames();
    }
  }

  loadNameLists() {
    this.censusNames = NameManager.loadNames(censusNamesFileName);
    this.additionalNames = NameManager.loadNames(additionalNamesFileName);
  }

  static loadNames(fileName) {
    console.log(`loading names from ${fileName}...`);

    const nameMap = new Map();
    function addNameToMap(line, index) {
      nameMap.set(line, index);
    }

    try {
      FileUtilities.forEachLineInFile(fileName, addNameToMap);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    console.log(`loading names complete size=${nameMap.size}`);

    return nameMap;
  }

  writeAdditionalNames(fileName) {
    if (!fileName) {
      fileName = additionalNamesFileName;
    }
    console.log(`writing additional names to ${fileName} size=${this.additionalNames.size} ...`);
  
    let fd = fs.openSync(fileName, 'w');
    
    function writeName(value, key, map) {
      fs.writeSync(fd, key + '\n');
    }

    this.additionalNames.forEach(writeName);

    fs.closeSync(fd);
  
    console.log(`writing additional names complete`);
  }
 
  addName(request, response) {
    let name = request.parameters.name;
    if (name === undefined || name == null) {
      console.error('NameManager::addName - missing name');
      return;
    }

    let responseMessage;

    let nameIsKnow = this.isNameValid(name);
    if (nameIsKnow) {
      responseMessage = `The name ${name} is already in the name list`;
    } else {
      let password = request.parameters.password;
      if (password === undefined || password == null) {
        console.error('NameManager::addName - missing password');
        return;
      }

      if (password !== Secrets.getSystemPassword()) {
        let message = "You must provide the correct password to add a name.";
        this.fillResponse(request, response, "Error", message);
        return;
      }

      console.log(`addName: ${name}`);

      this.addNameToAdditionalNames(name);

      responseMessage = `Name added: ${name}`;
    }

    this.fillResponse(request, response, "Error", responseMessage);
  }

  checkName(request, response) {
    let name = request.parameters.name;
    if (name === undefined || name == null) {
      console.error('grizilla::checkName - missing name');
      return;
    }

    console.log(`checkName: ${name}`);

    // check name
    let nameOkay = this.isNameValid(name);

    let responseMessage = '';
    if (!nameOkay) {
      responseMessage = `We do not reconginze the name ${name}.`;
    } else {
      responseMessage = `The name ${name} is a recongized name.`;
    }

    this.fillResponse(request, response, "Error", responseMessage);
  }

  fillResponse(request, response, status, message) {
    return response.json({
      status: status,
      message: message,
      source: 'NameManager'
    });
  }

}

module.exports = NameManager;

// function test() {

//   const nameManager = new NameManager();

//   console.log(`loading names ${new Date()} ...`);
//   nameManager.loadNameLists();
//   console.log(`loading names complete ${new Date()}`);

//   function checkName(name) {
//     const isValid = nameManager.isNameValid(name)
//     console.log(`${name} isValid=${isValid}`);
//   }
//   checkName("Chris");
//   checkName("Mark");
//   checkName("bad");
//   checkName("Mom");
//   checkName("Grand Ma");
// }

// test();
