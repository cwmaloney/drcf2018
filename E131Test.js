"use strict";

const { E131 } = require("./E131.js");

const testData = [
  { channelCount: 12*14*3, data: [ 180,   0,   0 ] },
  { channelCount: 12*14*3, data: [   0, 180,   0 ] },
  { channelCount: 12*14*3, data: [   0,   0, 180 ] },
  { channelCount: 12*14*3, data: [ 180,   0,   0,   0, 180,   0,   0,   0, 180 ] },
  { channelCount: 12*14*3, data: [   0, 180,   0,   0,   0, 180, 180,   0,   0 ] },
  { channelCount: 12*14*3, data: [   0,   0, 180, 180,   0,   0,   0, 180,   0 ] },
  { channelCount: 12*14*3, data: [ 180, 180, 180 ] },
  { channelCount: 12*14*3, data: [ 100, 100, 100 ] }
];

const e131 = new E131();

const configuration = { "universe": 22,
                        "address": "192.168.1.22",
                        "sourcePort": 6454,
                        "sendOnlyChangeData": false,
                        "refreshInterval": 1000 };

e131.configureUniverse(configuration);

let testIndex = -1;

function runNextTest() {
  if (++testIndex >= testData.length) testIndex = 0;

  const test = testData[testIndex];
  
  const channelData = new Array(test.channelCount);

  let dataIndex = 0;
  for (let channelIndex = 0; channelIndex < test.channelCount; channelIndex++) {
    if (++dataIndex >= test.data.length) dataIndex = 0;
    channelData[channelIndex] = test.data[dataIndex];
  }

  console.log("--- E131::runNextText", "testIndex", testIndex, 'data: ',  channelData);
  e131.setChannelData(configuration.address, configuration.universe, 1, channelData);
  e131.send(configuration.address, configuration.universe);
}

runNextTest();

setInterval(runNextTest, 5000);
