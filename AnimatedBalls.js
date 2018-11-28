"use strict";

const TransformFactory = require("./TransformFactory.js");

const FrameBuffer = require("./FrameBuffer.js");
const Color = require("./Color.js");

var frame = new FrameBuffer(168, 36);

var transform = TransformFactory.getTransform();
setInterval(animate, 2000);

function drawBall(frame, x, y, color){
    frame.fillRect(x - 2, y - 11, 5, 3, new Color(255, 255, 0));
    hackyCircle(frame, x,y, 10, color);
}

function hackyCircle(frame, x, y, radius, color) {
    //super hacky way to fill a circle
    for (let r = 0; r < radius - 1; ++r){
        frame.drawCircle(x, y, r, color);
    }

    for (let r = 0; r < radius - 1; ++r){
        frame.drawCircle(x+1, y, r, color);
    }

    for (let r = 0; r < radius - 1; ++r){
        frame.drawCircle(x-1, y, r, color);
    }

    for (let r = 0; r < radius - 1; ++r){
        frame.drawCircle(x, y+1, r, color);
    }

    for (let r = 0; r < radius - 1; ++r){
        frame.drawCircle(x, y-1, r, color);
    }
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
