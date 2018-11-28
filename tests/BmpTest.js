"use strict";

const EmulatorTransform = require("../EmulatorTransform.js");
const BitmapBuffer = require("../BitmapBuffer.js");
const HorizontalScroller = require("../HorizontalScroller.js");
const Color = require("../Color.js");

const Jimp = require('jimp');

var transform = new EmulatorTransform();

function testBmpFile() {
    Jimp.read("tests/sample1.bmp").then(image => {
        let bmpBuff = BitmapBuffer.fromImage(image);
        transform.transformScreen(bmpBuff);
    }, reason => console.log(reason));
}

async function testImageScroll() {
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(255, 255, 255));
    let srcImage = await Jimp.read("tests/car24.png");
    let scroller1 = new HorizontalScroller(36, 6, bmpBuff, transform);
    await scroller1.scrollImage(srcImage, 30, null, 12000);
    transform.close();
}

async function testBlit(){
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let srcImage = await Jimp.read("tests/car24.png");
    bmpBuff.blit(srcImage, 5, 5);
    transform.transformScreen(bmpBuff);
    transform.close();
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
    transform.close();

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
    bmpBuff.print3Lines("Welcome to", "Deanna Rose", "Children's Farmstead", BitmapBuffer.LITTERA_GREEN_11, BitmapBuffer.LITTERA_RED_11);
    transform.transformScreen(bmpBuff);
    transform.close();
}

function testPrint2Lines() {
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    bmpBuff.print2Lines("Deanna Rose", "Children's Farmstead", BitmapBuffer.LITTERA_GREEN_16);
    transform.transformScreen(bmpBuff);
    transform.close();
}

function testPrint1Line() {
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    bmpBuff.print1Line("Deanna Rose", BitmapBuffer.LITTERA_GREEN_16);
    transform.transformScreen(bmpBuff);
    transform.close();
}

async function testHorizontalScrollText(){
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let scroller1 = new HorizontalScroller(0, 1, bmpBuff, transform);
    let scroller2 = new HorizontalScroller(0, 18, bmpBuff, transform);
    scroller1.scrollText("Welcome to Deanna Rose Children's Farmstead", BitmapBuffer.LITTERA_GREEN_16, 30, null, 30000);
    await scroller2.scrollText("Home of the Holiday Lights at Farmstead Lane", BitmapBuffer.LITTERA_RED_16, 30, null, 30000);
    transform.close();
}

async function testScrollStop(){
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let scroller1 = new HorizontalScroller(0, 0, bmpBuff, transform);
    let promise = scroller1.scrollText("Welcome to Deanna Rose Children's Farmstead", BitmapBuffer.LITTERA_GREEN_16, 30, null, 30000);
    setTimeout(() => {
        promise = scroller1.scrollText("Welcome to Deanna Rose Children's Farmstead", BitmapBuffer.LITTERA_YELLOW_16, 30, null, 10000);
    }, 10000);
    promise.then(() => {transform.close()});
    
}

function testPrint(){
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    bmpBuff.print("Deanna Rose Children's Farmstead", BitmapBuffer.LITTERA_GREEN_16, 50, 5);
    transform.transformScreen(bmpBuff);
    transform.close();
}


async function testCheer(){
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let scroller1 = new HorizontalScroller(0, 0, bmpBuff, transform);
    scroller1.scrollText("Blake says: Go Cyclones!", BitmapBuffer.LITTERA_RED_11, null, null, 20000);
    let srcImage = await Jimp.read("tests/pennant24.png");
    let scroller2 = new HorizontalScroller(0, 12, bmpBuff, transform);
    await scroller2.scrollImage(srcImage, 30, null, 20000);
    transform.close();
}

BitmapBuffer.initializeFonts().then( () => {
    var test = "print3Lines";
    if (process.argv.length > 2){
        test = process.argv[2];
    }
    console.log("TEST: " + test);

    switch (test) {
        default:
        case "print3Lines":
            testPrint3Lines();
            break;
        case "print2Lines":
            testPrint2Lines();
            break;
        case "bmpFile":
            testBmpFile();
            break;
        case "drawing":
            testDrawing();
            break;
        case "print1Line":
            testPrint1Line();
            break;
        case "horizontalScrollText":
            testHorizontalScrollText();
            break;
        case "print":
            console.log("Text should be cropped")
            testPrint();
            break;
        case "scrollStop":
            console.log("Text should change color after 10 seconds")
            testScrollStop();
            break;
        case "imageScroll":
            testImageScroll();
            break;
        case "blit":
            testBlit();
            break;
        case "cheer":
            testCheer();
            break;
    }
});