"use strict";

const fs = require('fs');

const envConfig = require("../envConfig.js");
const TransformFactory = require("../TransformFactory.js");
const BitmapBuffer = require("../BitmapBuffer.js");
const MessageScene = require("../MessageScene.js");
const { colorNameToRgb } = require("../config-colors.js");
const { messages } = require("../config-messages.js");
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
        
        const perMessageMs = 250;
        const loops = 1;

        transform = TransformFactory.getGridzillaTransform();

        if (envConfig.get().targetEnv == "Dev" && fs.existsSync('MessageQueue.json')) {
            fs.unlinkSync('MessageQueue.json');
        }
        let messageScene = new MessageScene(transform, onPaused, nameManager, { perMessagePeriod: perMessageMs, period: 10 * 60 * 1000 });
        let sessionId = 0;

        let responseMessage;
        let status;
        const response = { json: function (obj) {
            responseMessage = obj.message;
            status = obj.status;
        }};

        //test an invalid message rejection
        messageScene.addMessage(
            { body: { recipient: "Melania", sender: "Donald", message: "Build the wall!", "sessionId": ++sessionId } },
            response);

        if (status != "Error"){
            throw responseMessage;
        }

        for (let i = 0; i < loops; ++i) {

            messages.forEach((elem) => {
                messageScene.addMessage(
                    { body: { recipient: "Melania", sender: "Donald", message: elem, "sessionId": ++sessionId } },
                    response);
            });

            //add a message of each color
            Object.keys(colorNameToRgb).forEach((color) => {
                messageScene.addMessage(
                    { body: { recipient: "Melania", sender: "Donald", message: messages[0], "color": color, "sessionId": ++sessionId } },
                    response);
            });

            //add a message on each background color
            Object.keys(colorNameToRgb).forEach((bgColor) => {
                messageScene.addMessage(
                    { body: { recipient: "Melania", sender: "Donald", message: messages[1], "color": "Red", backgroundColor: bgColor, "sessionId": ++sessionId } },
                    response);
            });
        }
    
        messageScene.run();    
    })
});
