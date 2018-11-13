const assert = require('assert');
const { GridzillaTransform } = require("../GridzillaTransform.js");

//run with: >npm test or IDE run config 
var universeMap;

class Screen{

  constructor(xSize, ySize) {
    this.data = Screen.prototype.createArray.call(this, xSize, ySize);
    //this.data = createArray(xSize, ySize);
  }

  //Returns a 3 element array containing RGB values
  getPixelColors(x, y)
  {
    return this.data[x][y];
  }

  setPixelColors(x, y, rgbArray)
  {
    this.data[x][y] = rgbArray;
  }

  createArray(xSize, ySize) {
    var result = [];
    for (var x = 0; x < xSize; ++x) {
      result[x] = [];
      for (var y = 0; y < ySize; ++y) {
        result[x][y] = [0, 0, 0];
      }
    }
    return result;
  };
}

describe('GridzillaTransfomer tests', function () {
  before(function() {
    initializeUniverseMap();
  });

  describe('Universe tests', function () {

    it('diagonal line', function () {

      var screen = new Screen(14,12);
      diagonalLine(screen, 0, 0, 12);
      
      //transform
      var transformer = new GridzillaTransform();
      transformer.transformUniverse(screen, 0, 0, "", 1);

      //check the result
      //universe cells 1,23,27,45,53,67,79,89,105,111,131,133
      var channelData = transformer.artnet.getUniverseInfo("", 1).channelData;
      checkDiagonalLine(channelData, 0, 0, 12);
    });
  });

  describe('Screen tests', function () {

    it('diagonal line', function () {
      var screen = new Screen(168,36);
      diagonalLine(screen, 0, 0, 36);
      
      //transform
      var transformer = new GridzillaTransform();
      transformer.transformScreen(screen);

      //check the result
      checkDiagonalLine(transformer.artnet.getUniverseInfo("", 9).channelData, 0, 0, 12);
      checkDiagonalLine(transformer.artnet.getUniverseInfo("", 5).channelData, 12, 0, 2);
      checkDiagonalLine(transformer.artnet.getUniverseInfo("", 6).channelData, 0, 2, 10);
      checkDiagonalLine(transformer.artnet.getUniverseInfo("", 2).channelData, 10, 0, 4);
      checkDiagonalLine(transformer.artnet.getUniverseInfo("", 3).channelData, 0, 4, 8);
    });
    
    it('horizontal line', function () {
      var screen = new Screen(168,36);
      horizontalLine(screen, 17, 168);
      
      //transform
      var transformer = new GridzillaTransform();
      transformer.transformScreen(screen);

      //check the result
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 5).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 6).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 7).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 8).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 17).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 18).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 19).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 20).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 29).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 30).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 31).channelData, 5, 14);
      checkHorizontalLine(transformer.artnet.getUniverseInfo("", 32).channelData, 5, 14);
    });
  });
});



function diagonalLine(screen, x, y, size) {
  for (var i = 0; i < size; ++i){
    screen.setPixelColors(x + i, y + i, [i+1,i+1,i+1]);
  }
};

function horizontalLine(screen, yPosition, length){
  for (var i = 0; i < length; ++i){
    screen.setPixelColors(i, yPosition, [i+1,i+1,i+1]);
  }
};

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
};

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
        for (var y = 0; y < GridzillaTransform.universeHeight; ++y) {
          column[y] = channelIndex;
          channelIndex += 3;
        }
        up = false;
    }
    else {
        for (var y = GridzillaTransform.universeHeight - 1; y >= 0; --y) {
          column[y] = channelIndex;
          channelIndex += 3;
        }
        up = true;
    }
  }
};
