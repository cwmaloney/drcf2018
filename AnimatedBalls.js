"use strict";

const TransformFactory = require("./TransformFactory.js");

const BitmapBuffer = require("./BitmapBuffer.js");
const Color = require("./Color.js");

var frame = BitmapBuffer.fromNew(168, 36);

var transform = TransformFactory.getTransform();
setInterval(animate, 2000);

function drawBall(frame, x, y, color){
    frame.fillRect(x - 2, y - 12, 5, 2, new Color(255, 255, 0));
    frame.drawCircle(x, y, 10, color);
    frame.fill(x, y, color);
}

var colors = [new Color(255, 0, 0), new Color(0, 255, 0), new Color(0, 0, 255)];
var colorIndex = 0;
async function animate() {
    for (let x = 15; x < 160; x+=23){
        drawBall(frame, x, 17, colors[colorIndex]);
        colorIndex = ++colorIndex % 3;
    }
    transform.transformScreen(frame);
}
