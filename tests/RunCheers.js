"use strict";

const fs = require('fs');

const envConfig = require("../envConfig.js");
const TransformFactory = require("../TransformFactory.js");
const BitmapBuffer = require("../BitmapBuffer.js");
const CheerScene = require("../CheerScene.js");
const { teamNameToDataMap } = require("../config-teams.js");
const { colorNameToRgb } = require("../config-colors.js");
const NameManager = require("../NameManager.js");
const ImageManager = require("../ImageManager.js");
const nameManager = new NameManager();

console.log(`loading names  @${new Date()} ...`);
nameManager.loadNameLists();
console.log(`loading names complete  @${new Date()}`);

var transform;

function onPaused() {

}

BitmapBuffer.initializeFonts().then( () => {
    ImageManager.initialize().then( () => {
        
        const perCheerMs = 500;
        const loops = 5;

        transform = TransformFactory.getTransform();


        if (envConfig.get().targetEnv == "Dev" && fs.existsSync('CheerQueue.json')) {
            fs.unlinkSync('CheerQueue.json');
        }
        let cheerScene = new CheerScene(transform, onPaused, nameManager, { perCheerPeriod: perCheerMs, period: 10 * 60 * 1000 });
        let sessionId = 0;
        const response = { json: function () {} };
        
        for (let i = 0; i < loops; ++i) {
            //add each team with no sender
            Object.keys(teamNameToDataMap).forEach((key) => {
                cheerScene.addCheer({ "body": { "teamName": key, "sessionId":  ++sessionId} }, response);
            });
    
            //add each team with a sender
            Object.keys(teamNameToDataMap).forEach((key) => {
                cheerScene.addCheer({ "body": { "teamName": key, "sender": "Blake", "sessionId":  ++sessionId} }, response);
            });

            //add each color with no sender
            Object.keys(colorNameToRgb).forEach((key) => {
                cheerScene.addCheer({ "body": { "colorNames": [key], "sessionId":  ++sessionId} }, response);
            });

            //add groups of 4 colors with a sender
            for (let j = 0; j < Object.keys(colorNameToRgb).length - 4; ++j){
                let colors = [];
                for (let k = 0; k < 4; ++k) {
                    colors[k] = Object.keys(colorNameToRgb)[j + k];
                }
                cheerScene.addCheer({ "body": { "colorNames": colors, "sender": "Blake", "sessionId":  ++sessionId} }, response);
            }
        }
    
        cheerScene.run();    
    })
});
