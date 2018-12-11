"use strict";

const TransformFactory = require("../TransformFactory.js");
const BitmapBuffer = require("../BitmapBuffer.js");
const ImageScene = require("../ImageScene.js");
const ImageManager = require("../ImageManager.js");

var transform;

function onPaused() {

}

BitmapBuffer.initializeFonts().then( () => {
    ImageManager.initialize().then( () => {
        ImageScene.initialize();

        const perImageMs = 2500;

        transform = TransformFactory.getTransform();

        let imageScene = new ImageScene(transform, onPaused, { perImagePeriod: perImageMs, period: 5 * 60 * 1000 });

    
        imageScene.run();    
    })
});
