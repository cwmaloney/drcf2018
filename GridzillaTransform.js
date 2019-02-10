"use strict";

const { ArtNet } = require("./ArtNet.js");


/**
 * GridzillaTransform.js
 * This class will transform a screen buffer to ArtNet data for the Gridzilla light display.
 * 
 * See README.md for more details
 */


/**   
 * To illustrate the screen buffer
 * An example 3x3 screen
 * var screen = [[[0,0 RGB],[0,1 RGB],[0,2 RGB]],
 * [[1,0 RGB],[1,1 RGB],[1,2 RGB]],
 * [[2,0 RGB],[2,1 RGB],[2,2 RGB]]
 * ];
 * 
 * 7,8,9
 * 4,5,6
 * 1,2,3
 * 
 *var screen = [
 *  [[1, 1, 1], [4, 4, 4], [7, 7, 7]],
 *  [[2, 2, 2], [5, 5, 5], [8, 8, 8]],
 *  [[3, 3, 3], [6, 6, 6], [9, 9, 9]]];
 */

const controllerAddresses = ["192.168.1.140", "192.168.1.141", "192.168.1.142"];
const universeInfos = [];

//How many universes are in a controller
const controllerWidth = 4;
const controllerHeight = 3;
const universesPerController = controllerWidth * controllerHeight;


const xPanels = 12;
const yPanels = 3;


class GridzillaTransform {
    
  get name() {
    return "Gridzilla";
  }

  /**
   * The overall width of Gridzilla in pixels
   */
  get width() {
    return GridzillaTransform.panelWidth * xPanels;
  }
  
  /**
   * The overall height of Gridzilla in pixels
   */
  get height() {
    return GridzillaTransform.panelHeight * yPanels;
  }

    /**
     * Use TransfomerFactory.getGridzillaTransformer()
     */
    constructor() {
        this.artnet = new ArtNet();
        
        //configure universes
        for (var controllerIndex = 0; controllerIndex < controllerAddresses.length; ++controllerIndex){
            for (var i = 0; i < universesPerController; ++i){
            
                let universeInfo = {
                    "address": controllerAddresses[controllerIndex],
                    "universe": i,
                    "sourcePort": 6454,
                    "sendOnlyChangeData": false,
                    "sendSequenceNumbers": false
                };
                
                universeInfos[universeInfos.length] = universeInfo;
                this.artnet.configureUniverse(universeInfo);
            }
        }
    }

    close(){
        this.artnet.close();
    }

    transformScreen(screen){
        
        //transform all universes
        for (var controllerIndex = 0; controllerIndex < controllerAddresses.length; ++controllerIndex){
          let universeIndex = 0;
            for (var rowIndex = controllerHeight - 1; rowIndex >= 0; --rowIndex){
                this.transformControllerRow(screen, 
                    GridzillaTransform.panelWidth * controllerWidth * controllerIndex, 
                    GridzillaTransform.panelHeight * rowIndex, 
                    controllerAddresses[controllerIndex], 
                    universeIndex);
                universeIndex+=controllerWidth;
            }
        }
     
        //send all universes
        for (var universeIndex = 0; universeIndex < universeInfos.length; ++universeIndex){
             this.artnet.send(universeInfos[universeIndex].address, universeInfos[universeIndex].universe);
        }
    }

    transformControllerRow(screen, xOffset, yOffset, address, universe){
        for (var i = 0; i < controllerWidth; ++i){
            this.transformUniverse(screen, xOffset + GridzillaTransform.panelWidth * i, yOffset, address, universe + i);
        }
    }

    transformUniverse(screen, xOffset, yOffset, address, universe) {
        //channels use a 1 based index
        let channelIndex = 1;
        let up = true;
        //go accross the width
        for (let x = 0; x < GridzillaTransform.panelWidth; ++x){
            //up or down the height
            if (up) {
                for (let y = 0; y < GridzillaTransform.panelHeight; ++y) {
                    //get the RGB color, invert the y axis, gridzilla coordinates start in the lower left, the screen starts in the upper left
                    this.artnet.setChannelData(address, universe, channelIndex, screen.getPixelColors(
                        xOffset + x, 
                        this.height - (yOffset + y) - 1));
                    channelIndex += 3;
                }
                up = false;
            }
            else {
                for (let y = GridzillaTransform.panelHeight - 1; y >= 0; --y) {
                    //get the RGB color, invert the y axis, gridzilla coordinates start in the lower left, the screen starts in the upper left
                    this.artnet.setChannelData(address, universe, channelIndex, screen.getPixelColors(xOffset + x, 
                      this.height - (yOffset + y) - 1));
                    channelIndex += 3;
                }
                up = true;
            }
        }
    }
}
//Hom many pixels are in a universe these are defined as globals because the mocha unit tests depend on them
GridzillaTransform.panelWidth = 14;
GridzillaTransform.panelHeight = 12;
module.exports = GridzillaTransform;