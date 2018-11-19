const assert = require('assert');
const { GridzillaTransform } = require("../GridzillaTransform.js");
const { Screen } = require("./Screen.js");

//run with: >npm test or IDE run config 

// universeMap is the mapping from x,y coordinates to the universe channel for that position's red value.
// add one for the green value channel position and two for the blue value
var universeMap;

const controllerAddresses = ["192.168.1.140", "192.168.1.141", "192.168.1.142"];

describe('GridzillaTransfomer tests', function () {
  before(function() {
    initializeUniverseMap();
  });

  describe('Universe tests', function () {

    it('diagonal line', function () {

      var screen = new Screen(14,12);
      screen.diagonalLine(0, 0, 12);
      
      //transform
      var transformer = new GridzillaTransform();
      transformer.transformUniverse(screen, 0, 0, controllerAddresses[0], 1);

      //check the result
      //universe cells 1,23,27,45,53,67,79,89,105,111,131,133
      var channelData = transformer.artnet.getUniverseInfo(controllerAddresses[0], 1).channelData;
      checkDiagonalLine(channelData, 0, 0, 12);
    });
  });

  describe('Screen tests', function () {

    it('diagonal line', function () {
      var screen = new Screen(168,36);
      screen.diagonalLine(0, 0, 36);
      
      //transform
      var transformer = new GridzillaTransform();
      transformer.transformScreen(screen);

      //check the result
      checkDiagonalLine(transformer.artnet.getUniverseInfo(controllerAddresses[0], 8).channelData, 0, 0, 12);
      checkDiagonalLine(transformer.artnet.getUniverseInfo(controllerAddresses[0], 4).channelData, 12, 0, 2);
      checkDiagonalLine(transformer.artnet.getUniverseInfo(controllerAddresses[0], 5).channelData, 0, 2, 10);
      checkDiagonalLine(transformer.artnet.getUniverseInfo(controllerAddresses[0], 1).channelData, 10, 0, 4);
      checkDiagonalLine(transformer.artnet.getUniverseInfo(controllerAddresses[0], 2).channelData, 0, 4, 8);
    });
    
    it('horizontal line', function () {
      var screen = new Screen(168,36);
      screen.horizontalLine(17, 168);
      
      //transform
      var transformer = new GridzillaTransform();
      transformer.transformScreen(screen);

      //check the result
      //TODO: renumber these to be 0 based universes
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[0], 4).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[0], 5).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[0], 6).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[0], 7).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[1], 4).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[1], 5).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[1], 6).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[1], 7).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[2], 4).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[2], 5).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[2], 6).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo(controllerAddresses[2], 7).channelData, 5, 14);
    });
  });
});




function checkDiagonalLine(universeData, x, y, size){
  for (var i = 0; i < size; ++i){
    let universeOffset = getUniverseOffset(x + i, y + i);
    assert.equal(universeData[universeOffset] > 0, true);
    assert.equal(universeData[universeOffset + 1] > 0, true);
    assert.equal(universeData[universeOffset + 2] > 0, true);
  }
}

function checkHorizontalLine(universeData, yPosition, length){
  for (var i = 0; i < length; ++i){
    let universeOffset = getUniverseOffset(i, yPosition);
    assert.equal(universeData[universeOffset] > 0, true);
    assert.equal(universeData[universeOffset + 1] > 0, true);
    assert.equal(universeData[universeOffset + 2] > 0, true);
  }
}

function getUniverseOffset(x, y)
{
  return universeMap[x][y];
}

function initializeUniverseMap(){
  universeMap =  [];
  var channelIndex = 0;
  var up = true;
  for (var x = 0; x < GridzillaTransform.universeWidth; ++x){
    let column = [];
    universeMap[x] = column;
    //up or down the height
    if (up) {
        for (let y = 0; y < GridzillaTransform.universeHeight; ++y) {
          column[y] = channelIndex;
          channelIndex += 3;
        }
        up = false;
    }
    else {
        for (let y = GridzillaTransform.universeHeight - 1; y >= 0; --y) {
          column[y] = channelIndex;
          channelIndex += 3;
        }
        up = true;
    }
  }
}
