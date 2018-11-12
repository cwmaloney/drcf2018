const Color = require("./Color.js");
const FrameBuffer = require("./FrameBuffer.js");

const frameBuffer = new FrameBuffer(10,10);
frameBuffer.drawLine(0, 0, 5, 10, new Color(255,255,255));
frameBuffer.drawCircle(5, 5, 5, new Color(255,255,255));
