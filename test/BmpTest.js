"use strict";

const EmulatorTransform = require("../EmulatorTransform.js");
const BitmapBuffer = require("../BitmapBuffer.js");
const Color = require("../Color.js");

const Jimp = require('jimp');

var transform = new EmulatorTransform();

function testBmpFile() {
    Jimp.read("test/sample1.bmp").then(image => {
        let bmpBuff = BitmapBuffer.fromImage(image);
        transform.transformScreen(bmpBuff);
    }, reason => console.log(reason));
}

function testDrawing() {
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    bmpBuff.drawPixel(0, 0, new Color(255, 0, 0));
    bmpBuff.drawPixel(0, 1, new Color(255, 0, 0));
    bmpBuff.drawPixel(1, 0, new Color(255, 0, 0));
    bmpBuff.drawPixel(1, 1, new Color(255, 0, 0));

    bmpBuff.drawLine(5, 0, 40, 35, new Color(0, 255, 0));

    bmpBuff.drawRect(45, 5, 5, 26, new Color(0, 0, 255));

    bmpBuff.fillRect(55, 5, 5, 26, new Color(255, 255, 0));

    bmpBuff.drawCircle(75, 18, 10, new Color(255, 0, 255));
    transform.transformScreen(bmpBuff);

    // var image = new Jimp(168, 36, Jimp.rgbaToInt(255, 255, 255, 255), (err, image) => {
    //     image.setPixelColor(Jimp.rgbaToInt(255, 0, 0, 255), 0, 0);
    //     image.setPixelColor(Jimp.rgbaToInt(255, 0, 0, 255), 1, 1);
    //     // image.setPixelColor(Jimp.rgbaToInt(255, 0, 0, 255), 0, 35);
    //     // image.setPixelColor(Jimp.rgbaToInt(255, 0, 0, 255), 167, 35);
    //     image.write("test/out.bmp");
    //     let bmpBuff = new BitmapBuffer(image);
    //     transform.transformScreen(bmpBuff);
    // });
}

function testPrint3Lines() {
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    bmpBuff.print3Lines("Welcome to", "Deanna Rose", "Children's Farmstead", BitmapBuffer.LITTERA_GREEN_11);//.then( () => transform.transformScreen(bmpBuff));
    transform.transformScreen(bmpBuff);
}

function testPrint2Lines() {
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    bmpBuff.print2Lines("Deanna Rose", "Children's Farmstead", BitmapBuffer.LITTERA_GREEN_16);//.then( () => transform.transformScreen(bmpBuff));
    transform.transformScreen(bmpBuff);
}

BitmapBuffer.initializeFonts().then( () => {


    //testBmpFile();
    //testDrawing();
    testPrint3Lines();
    //testPrint2Lines();
});