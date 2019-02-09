"use strict";

const { E131 } = require("./E131.js");

const testData = [
  { channelCount: 12*14*3, data: [ 180,   0,   0 ] },
  { channelCount: 12*14*3, data: [   0, 180,   0 ] },
  { channelCount: 12*14*3, data: [   0,   0, 180 ] },
  { channelCount: 12*14*3, data: [   0,   0,   0 ] },

  { channelCount: 1*3,     data: [ 180, 180, 180 ] },
  { channelCount: 2*3,     data: [ 180, 180, 180 ] },
  { channelCount: 4*3,     data: [ 180, 180, 180 ] },
  { channelCount: 8*3,     data: [ 180, 180, 180 ] },
  { channelCount: 14*3,    data: [ 180, 180, 180 ] },
  { channelCount: 3*14*3,  data: [ 180, 180, 180 ] },
  { channelCount: 6*14*3,  data: [ 180, 180, 180 ] },
  { channelCount: 12*14*3, data: [ 180, 180, 180 ] },

  { channelCount: 12*14*3, data: [ 180,   0,   0,   0,   0,   0,   0,   0,   0 ] },
  { channelCount: 12*14*3, data: [   0,   0,   0,   0, 180,   0,   0,   0,   0 ] },
  { channelCount: 12*14*3, data: [   0,   0,   0,   0,   0,   0,   0,   0, 180 ] },
  { channelCount: 12*14*3, data: [ 180, 180, 180 ] },
  { channelCount: 12*14*3, data: [  90,  90,  90 ] },
  { channelCount: 12*14*3, data: [  0,   0,    0 ] },
];

const e131 = new E131();

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

const universeInfos = [];
    
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
  
  universeInfos[universeIndex] = universeInfo;
  e131.configureUniverse(universeInfo);
}

let testIndex = -1;

function runNextTest() {
  if (++testIndex >= testData.length) testIndex = 0;

  const test = testData[testIndex];
  
  const channelData = new Array(test.channelCount);

  let dataIndex = 0;
  for (let channelIndex = 0; channelIndex < test.channelCount; channelIndex++) {
    if (dataIndex >= test.data.length) dataIndex = 0;
    channelData[channelIndex] = test.data[dataIndex++];
  }

  console.log("--- E131::runNextText", "testIndex", testIndex, 'data: ',  channelData);
  for (var universeIndex = 0; universeIndex < universeToControllerMap.length; ++universeIndex) {         
    const universeinfo = universeInfos[universeIndex];

    e131.setChannelData(universeinfo.address, universeinfo.universe, 1, channelData);
    e131.send(universeinfo.address, universeinfo.universe);
  }
}

runNextTest();

setInterval(runNextTest, 3000);
