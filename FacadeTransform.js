"use strict";
 
const { E131 } = require("./E131.js");

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Panel and Universe Layout
//                   +----------+----------+
//                  /           |           \
//                 /      28    |     29     \
//                /             |             \
//	              +------+------+------+------+
//                |      |      |      |      |
//	              |  24  |  25  |  26  |  27  | 
//                |      |      |      |      | 
//	   +----------+------+------+------+------+----------+
//    /           |      |      |      |      |           \
//	 /      18    |  19  |  20  |  21  |  22  |      23    \
//  /             |      |      |      |      |             \
//	+------+------+------+------+------+------+------+------+
//  |      |      |      |      |      |      |      |      |
//	|  10  |  11  |  12  |  13  |  14  |  15  |  16  |  17  |
//  |      |      |      |      |      |      |      |      |
//	+------+------+------+------+------+------+------+------+
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

/*
We use 5 panel maps to map a "drawing" bitmap to the facade.

Each map identifies the first channel (of a RGB triplet) 
for a pixel of the drawing grid.

The drawing grid size is :
  12 pixels per panel x 8 panels = 96
  14 pixels per panel x 4 panels = 56

  The top panels are only 12 pixels tall.

We use -1 to mark pixels that are not present on the facade.

*/

// Rectanglular Panel																																																									
const rectMap =  [
  //  1    2    3    4    5    6    7    8    9   10   11   12
  [ 155, 154, 127, 126,  99,  98,  71,  70,  43,  42,  15,  14],
  [ 156, 153, 128, 125, 100,  97,  72,  69,  44,  41,  16,  13],
  [ 157, 152, 129, 124, 101,  96,  73,  68,  45,  40,  17,  12],
  [ 158, 151, 130, 123, 102,  95,  74,  67,  46,  39,  18,  11],
  [ 159, 150, 131, 122, 103,  94,  75,  66,  47,  38,  19,  10],
  [ 160, 149, 132, 121, 104,  93,  76,  65,  48,  37,  20,   9],
  [ 161, 148, 133, 120, 105,  92,  77,  64,  49,  36,  21,   8],
  [ 162, 147, 134, 119, 106,  91,  78,  63,  50,  35,  22,   7],	
  [ 163, 146, 135, 118, 107,  90,  79,  62,  51,  34,  23,   6],		
  [ 164, 145, 136, 117, 108,  89,  80,  61,  52,  33,  24,   5],
  [ 165, 144, 137, 116, 109,  88,  81,  60,  53,  32,  25,   4],	
  [ 166, 143, 138, 115, 110,  87,  82,  59,  54,  31,  26,   3],
  [ 167, 142, 139, 114, 111,  86,  83,  58,  55,  30,  27,   2],
  [ 168, 141, 140, 113, 112,  85,  84,  57,  56,  29,  28,   1]
] ;

// left triangle
const lTriMap =  [
  //  1    2    3    4    5    6    7    8    9   10   11   12   
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1, 112],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1, 123, 122, 113],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1, 132, 131, 124, 121, 114],
  [  -1,  -1,  -1,  -1,  -1, 139, 138, 133, 130, 125, 120, 115],
  [  -1,  -1,  -1, 144, 143, 140, 137, 134, 129, 126, 119, 116],
  [  -1, 147, 146, 145, 142, 141, 136, 135, 128, 127, 118, 117]
];

// left trapezoid
const lTrpMap =  [ 
  //  1    2    3    4    5    6    7    8    9   10   11   12   
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1, 100],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  79,  80, 101],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -2,  58,  59,  78,  81, 100],
  [  -1,  -1,  -1,  -1,  -1,  39,  40,  57,  60,  77,  82,  99],
  [  -1,  -1,  -1,  22,  23,  38,  41,  56,  61,  76,  83,  98],
  [  -1,   7,   8,  21,  24,  37,  42,  55,  62,  75,  84,  97],
  [ 111,   6,   9,  20,  25,  36,  43,  54,  63,  74,  85,  96],
  [ 110,   5,  10,  19,  26,  35,  44,  53,  64,  73,  86,  95],
  [ 109,   4,  11,  18,  27,  34,  45,  52,  65,  72,  87,  94],
  [ 108,   3,  12,  17,  28,  33,  46,  51,  66,  71,  88,  93],
  [ 107,   2,  13,  16,  29,  32,  47,  50,  67,  70,  89,  92],
  [ 106,   1,  14,  15,  30,  31,  48,  49,  68,  69,  90,  91]
];
// right trapezoid
const rTrpMap =  [
  //  1    2    3    4    5    6    7    8    9   10   11   12   
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [ 144,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [ 143, 122, 121,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [ 142, 123, 120, 101, 100,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [ 141, 124, 119, 102,  99,  82,  81,  -1,  -1,  -1,  -1,  -1],
  [ 140, 125, 118, 103,  98,  83,  80,  65,  64,  -1,  -1,  -1],
  [ 139, 126, 117, 104,  97,  84,  79,  66,  63,  50,  49,  -1],
  [ 138, 127, 116, 105,  96,  85,  78,  67,  62,  51,  48,  37],
  [ 137, 128, 115, 106,  95,  86,  77,  68,  61,  52,  47,  38],
  [ 136, 129, 114, 107,  94,  87,  76,  69,  60,  53,  46,  39],
  [ 135, 130, 113, 108,  93,  88,  75,  70,  59,  54,  45,  40],
  [ 134, 131, 112, 109,  92,  89,  74,  71,  58,  55,  44,  41],
  [ 133, 132, 111, 110,  91,  90,  73,  72,  57,  56,  43,  42]
]
// right triangle
const rTriMap =  [
  //  1    2    3    4    5    6    7    8    9   10   11   12   
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  36,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  35,  26,  25,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  34,  27,  24,  17,  16,  -1,  -1,  -1,  -1,  -1,  -1,  -1],
  [  33,  28,  23,  18,  15,  10,   9,  -1,  -1,  -1,  -1,  -1],
  [  32,  29,  22,  19,  14,  11,   8,   5,   4,  -1,  -1,  -1],
  [  31,  30,  21,  20,  13,  12,   7,   6,   3,   2,   1,  -1]
];
   
// universeToControllerMap maps universes to controller addresses
//  Some controllers provide server mor than one universe.
//  Universes are unique across contorllers.
const universeToControllerMap = [
  { universe: 10, controllerAddress: "192.168.1.20" },
  { universe: 11, controllerAddress: "192.168.1.20" },
  { universe: 12, controllerAddress: "192.168.1.20" },
  { universe: 13, controllerAddress: "192.168.1.20" },
  { universe: 14, controllerAddress: "192.168.1.20" },
  { universe: 15, controllerAddress: "192.168.1.20" },
  //
  { universe: 16, controllerAddress: "192.168.1.21" },
  { universe: 17, controllerAddress: "192.168.1.21" },
  { universe: 18, controllerAddress: "192.168.1.21" },
  { universe: 19, controllerAddress: "192.168.1.21" },
  { universe: 20, controllerAddress: "192.168.1.21" },
  { universe: 21, controllerAddress: "192.168.1.21" },
  //
  { universe: 22, controllerAddress: "192.168.1.22" },
  { universe: 23, controllerAddress: "192.168.1.22" },
  { universe: 24, controllerAddress: "192.168.1.22" },
  { universe: 25, controllerAddress: "192.168.1.22" },
  { universe: 26, controllerAddress: "192.168.1.22" },
  { universe: 27, controllerAddress: "192.168.1.22" },
  //
  { universe: 28, controllerAddress: "192.168.1.23" },
  { universe: 29, controllerAddress: "192.168.1.23" },
  { universe: 30, controllerAddress: "192.168.1.23" },
  { universe: 31, controllerAddress: "192.168.1.23" },
  { universe: 32, controllerAddress: "192.168.1.23" },
  { universe: 33, controllerAddress: "192.168.1.23" }
  ];

  // To make this easy to read:
  //  We use short panel map names and element names.
  //  We use short elemnt names - t for template and u for universe.
  //  This follows physical order top of the facad is at the top in the source.
  const panels = [
    [ null,                 null,               {t: rTriMap, u: 28}, {t: rTrpMap, u: 28}, {t: lTrpMap, u: 29}, {t: lTriMap, u: 29}, null,                null                ],
    [ null,                 null,               {t: rectMap, u: 24}, {t: rectMap, u: 25}, {t: rectMap, u: 26}, {t: rectMap, u: 27}, null,                null                ],
    [ {t: rTriMap, u: 18}, {t: rTrpMap, u: 18}, {t: rectMap, u: 19}, {t: rectMap, u: 20}, {t: rectMap, u: 21}, {t: rectMap, u: 22}, {t: lTrpMap, u: 23}, {t: lTriMap, u: 23} ],
    [ {t: rectMap, u: 10}, {t: rectMap, u: 11}, {t: rectMap, u: 12}, {t: rectMap, u: 13}, {t: rectMap, u: 14}, {t: rectMap, u: 15}, {t: rectMap, u: 16}, {t: rectMap, u: 17} ]
  ];

  const xPanels = 8;
  const yPanels = 4;
  const panelWidth = 12;
  const panelHeight = 14;


  class FacadeTransform {
    
    get name() {
      return "Facade";
    }
    /**
     * The  width of facade in pixels
     */
    get width() {
      return panelWidth * xPanels;
    }
    /**
     * The  height of facade in pixels
     */
    get height() {
      return panelHeight * yPanels;
    }
  
    /**
     * Use TransfomerFactory.getTransformer()
     */
    constructor() {
      this.e131 = new E131();
      this.universeInfos = [];
      
      //configure universes
      for (var universeIndex = 0; universeIndex < universeToControllerMap.length; ++universeIndex){         
        const universe = universeToControllerMap[universeIndex];
        let universeInfo = {
            "address": universe.controllerAddress,
            "universe": universe.universe,
            "sourcePort": 6454,
            "sendOnlyChangeData": false,
            "sendSequenceNumbers": false
        };
        
        this.universeInfos[universeIndex] = universeInfo;
        this.e131.configureUniverse(universeInfo);
    }
  }

  close() {
      this.e131.close();
  }

  transformScreen(screen) {
      
    //transform each panel
    for (var panelRow = 0; panelRow < yPanels; panelRow++){
      for (var panelColumn = 0; panelColumn < xPanels; panelColumn++){
          this.transformPanel(
              screen,
              panelRow,
              panelColumn);
        }
    }
 
    //send all universes
    for (let universeIndex = 0; universeIndex < universeToControllerMap.length; ++universeIndex){
      const universe = universeToControllerMap[universeIndex];
      this.e131.send(universe.controllerAddress, universe.universe);
    }
  }

  getControllerAddress(universe) {
    for (let index = 0; index < universeToControllerMap.length; index++) {
      const entry = universeToControllerMap[index];
      if (entry.universe == universe) {
        return entry.controllerAddress;
      }
    }
    return null;
  }

  transformPanel(screen, panelRow, panelColumn) {
    const rowPanels = panels[panelRow];
    const panel = rowPanels[panelColumn];

    // the facade does not have panels for some locations
    if (panel) {
      const xScreenOffset = panelRow * panelWidth;
      const yScreenOffset = panelColumn * panelHeight;

      const universe = panel.u;
      const controllerAddress = this.getControllerAddress(panel.u);
      const panelTemplate = panel.t;

      for (let row = 0; row < panelWidth; row++) {
        for (let column = 0; column < panelHeight; column++) {
          const pixelColors = screen.getPixelColors(
            xScreenOffset + row, yScreenOffset + column);

          const channelIndex = panelTemplate[row][column];

          // send data for all pixel that have channels (> -1)
          if (channelIndex >= 0) {
           this.e131.setChannelData(controllerAddress, universe, channelIndex, pixelColors);
          }
        }
      }
    }
  }

}

module.exports = FacadeTransform;
