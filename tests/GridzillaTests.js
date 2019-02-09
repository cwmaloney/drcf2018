"use strict";

const TransformFactory = require("../TransformFactory.js");
const BitmapBuffer = require("../BitmapBuffer.js");
const HorizontalScroller = require("../HorizontalScroller.js");
const Color = require("../Color.js");
const Font = require("../Font.js");

const Jimp = require('jimp');

var transform;

function testBmpFile() {
    Jimp.read("tests/sample1.bmp").then(image => {
        let bmpBuff = BitmapBuffer.fromImage(image);
        transform.transformScreen(bmpBuff);
    }, reason => console.log(reason));
}

async function testImageScroll() {
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(255, 255, 255));
    let srcImage = await Jimp.read("images/Christmas train006_36.png");
    let scroller1 = new HorizontalScroller(0, 0, bmpBuff, transform);
    await scroller1.scrollImage(srcImage, undefined, null, 12000);
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
    bmpBuff.fill(75, 18, new Color(127, 255, 127));

    transform.transformScreen(bmpBuff);
    transform.close();
}

function testPrint3Lines() {
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let font1 = new Font("Littera", 11, new Color(255, 0, 0));
    let font2 = new Font("Littera", 10, new Color(0, 255, 0));
    let font3 = new Font("Littera", 9, new Color(0, 0, 255));
    bmpBuff.print3Lines("Welcome to", "Deanna Rose", "Children's Farmstead", font1, font2, font3);
    transform.transformScreen(bmpBuff);
    transform.close();
}

function testPrint2Lines() {
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let font1 = new Font("Littera", 15, new Color(255, 255, 0));
    let font2 = new Font("Littera", 12, new Color(0, 255, 255));
    bmpBuff.print2Lines("Deanna Rose", "Children's Farmstead", font1, font2);
    transform.transformScreen(bmpBuff);
    transform.close();
}

function testPrint1Line() {
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let font = new Font("Littera", 18, new Color(0, 255, 0));
    bmpBuff.print1Line("Deanna Rose", font);
    transform.transformScreen(bmpBuff);
    transform.close();
}

async function testHorizontalScrollText(){
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let scroller1 = new HorizontalScroller(0, 1, bmpBuff, transform);
    let scroller2 = new HorizontalScroller(0, 18, bmpBuff, transform);
    let font1 = new Font("Littera", 16, new Color(255, 0, 0));
    let font2 = new Font("Littera", 16, new Color(0, 255, 0));
    scroller1.scrollText("Welcome to Deanna Rose Children's Farmstead", font1, null, null, 20000);
    await scroller2.scrollText("Home of the Holiday Lights at Farmstead Lane", font2, null, null, 20000);
    transform.close();
}

async function testScrollStop(){
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let scroller1 = new HorizontalScroller(0, 0, bmpBuff, transform);
    let font1 = new Font("Littera", 16, new Color(0, 255, 0));

    let promise = scroller1.scrollText("Welcome to Deanna Rose Children's Farmstead", font1, null, null, 30000);
    //telling the scroller to scroll before it finishes will call stop
    setTimeout(() => {
        let font2 = new Font("Littera", 16, new Color(255, 255, 0));
        promise = scroller1.scrollText("Welcome to Deanna Rose Children's Farmstead", font2, null, null, 10000);
    }, 10000);
    promise.then(() => {transform.close()});
    
}

function testPrint(){
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let font = new Font("Littera", 18, new Color(0, 255, 0));
    bmpBuff.print("Deanna Rose Children's Farmstead", font, 50, 5);
    transform.transformScreen(bmpBuff);
    transform.close();
}


async function testCheer1(){
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let scroller1 = new HorizontalScroller(0, 0, bmpBuff, transform);
    let font = new Font("Littera", 11, new Color(255, 255, 255));
    scroller1.scrollText("Blake says: Go Cyclones!", font, null, null, 20000);
    let srcImage = await Jimp.read("tests/pennant24.png");
    let scroller2 = new HorizontalScroller(0, 12, bmpBuff, transform);
    await scroller2.scrollImage(srcImage, null, null, 20000);
    transform.close();
}

async function testCheer2(){
    let bmpBuff = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));
    let srcImage = await Jimp.read("images/replaceTree36.png");
    let treeBuff = BitmapBuffer.fromImage(srcImage);
    treeBuff.switchColor(new Color(255, 0, 0), [new Color(255, 0, 0), new Color(255, 255, 0)]);
    //setTreeLights(srcImage, new Color(255, 0, 0), new Color(255, 0, 0));
    //await srcImage.write("test/out.png");
    bmpBuff.blit(treeBuff.image, 0, 0);
    bmpBuff.blit(treeBuff.image, 144, 0);
    let scroller1 = new HorizontalScroller(24, 10, bmpBuff, transform);
    let font = new Font("Littera", 16, new Color(255, 0, 0));
    await scroller1.scrollText("Blake says: Go Cyclones!", font, null, 120, 8000);
    transform.close();
}

BitmapBuffer.initializeFonts().then( () => {
    transform = TransformFactory.getGridzillaTransform();
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
        case "scrollText":
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
        case "cheer1":
            testCheer1();
            break;
        case "cheer2":
            testCheer2();
            break;
    }
});