
//////////////////////////////////////////////////////////////////////////////
// colors
//////////////////////////////////////////////////////////////////////////////

const colorNameToChannelDataMap = {
  on: [ 255, 255, 255 ],
  white: [ 255, 255, 255 ],
  snow: [ 225, 225, 225 ],
  celadon: [ 162, 215, 165 ],
  gray: [ 32, 32, 32 ],
  silver: [ 175, 175, 175 ],
  
  red: [ 255, 0, 0 ],
  crimson: [ 0x84, 0x16, 0x17],
  //crimson: [ 220, 20, 60 ],
  darkRed: [20, 0, 0],
  scarlet: [ 204, 0 , 0 ],

  pink: [ 255, 102, 178 ],
  darkPink: [ 175, 75, 140 ],
  maroon: [ 128, 0, 0],
  fuchsia: [ 255, 0, 255 ],
  magenta: [ 255, 0, 255 ],
  
  orange: [ 255, 127, 0 ],
  orangeRed: [255, 69, 0],

  yellow: [ 255, 255, 0 ],

  cream: [ 0xFD, 0xF9, 0xD8],
  brown: [ 32, 20, 11 ],
  darkBrown: [ 20, 13, 5 ],
  gold: [ 215, 185, 0 ],

  yellowGreen: [ 154, 205, 50 ],
  chartreuse: [ 63, 128, 0 ],

  green:[ 0, 255, 0 ],
  darkGreen: [ 0, 30, 0 ],
  grinchGreen: [ 40, 190, 0 ],
  olive: [ 45, 65, 0 ],
  turquoise: [ 64, 224, 204 ],
  darkTurquoise: [ 0, 206, 209 ],
  lime: [127, 255, 0],
  teal: [ 0, 128, 128],

  blueGreen: [ 13, 152, 186 ],
  cyan: [ 0, 250, 250],
  darkCyan: [ 0, 90, 90 ],
 
  blue: [ 0, 0, 255 ],
  lightBlue: [ 107, 164, 184 ],
  cornFlowerBlue: [ 70, 119, 207 ],
  darkBlue: [ 0, 0, 30],
  royalBlue: [ 65, 105, 225],
  navy: [0, 0, 25],
  midnightBlue: [ 25, 25, 112 ],
  sportingBlue: [ 147, 177, 215 ],
  
  indigo: [ 28, 0, 64 ],
  darkIndigo: [ 7, 0, 16 ],

  blueViolet: [ 138, 43, 226 ],
  
  purple: [ 75, 0, 128 ],
  royalPurple: [ 102, 51, 153 ],
  hornedFrogPurple: [ 77, 25, 121 ],

  violet: [ 139, 0, 255 ],
  darkViolet: [ 35, 0, 58 ],

  black: [ 0, 0, 0 ],
  off:  [ 0, 0, 0 ]
};

module.exports = {
  colorNameToChannelDataMap,
  };
