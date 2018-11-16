"use strict";

const EmulatorTransform = require("../EmulatorTransform.js");

const FrameBuffer = require("../FrameBuffer.js");
const Color = require("../Color.js");

console.log("This is a test of the EmulatorTransform.");
console.log("Requires the displayEmulatorServer to be running.");

var transform = new EmulatorTransform();
var frame = new FrameBuffer(168, 36);

frame.drawLine(0, 0, 36, 36, new Color(255, 0, 0));
frame.drawRect(55, 1, 5, 34, new Color(0, 0, 255));
frame.drawCircle(100, 17, 16, new Color(0, 255, 0));
frame.drawRect(145, 1, 5, 34, new Color(255, 255, 0));

transform.transformScreen(frame);


console.log("Test complete.");