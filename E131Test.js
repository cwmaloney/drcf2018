"use strict";

const { E131 } = require("./E131.js");

const testData = [
  { channelCount: 12*14*3, data: [ 255,   0,   0 ] },
  { channelCount: 12*14*3, data: [   0, 255,   0 ] },
  { channelCount: 12*14*3, data: [   0,   0, 255 ] },
  { channelCount: 12*14*3, data: [ 255, 0, 0,   0, 255, 0,   0, 0, 255 ] },
  { channelCount: 12*14*3, data: [ 255, 0, 0,   0, 255, 0,   0, 0, 255 ] },
  { channelCount: 12*14*3, data: [ 255, 255, 255 ] },
  { channelCount: 12*14*3, data: [ 100, 100, 100 ] },

];

const e131 = new E131();

const universe = 0;
const configuration = { "universe": universe,
                        "address": "10.0.0.18",
                        "sourcePort": 6454,
                        "sendOnlyChangeData": false,
                        "refreshInterval": 1000 };

e131.configureUniverse(configuration);

let testIndex = -1;

function runNextTest() {
  if (++testIndex >= testData.length) testIndex = 0;

  const test = testData[testIndex];
  
  const channelData = new Uint8Array(test.channelCount);

  let dataIndex = 0;
  for (let channelIndex = 0; channelIndex < test.channelCount; channelIndex++) {
    if (++dataIndex >= test.data.length) dataIndex = 0;
    channelData[channelIndex] = test.data[dataIndex];
  }

  console.log("--- E131::runNextText", "testIndex", testIndex, 'data: ',  channelData);
  e131.setChannelData(universe, 1, channelData);
  e131.send(universe);
}

runNextTest();

setInterval(runNextTest, 5000);
