"use strict";

// artnet "library"
const { ArtNet } = require("./ArtNet.js");

// HTTP server support
const express = require("express");
const bodyParser = require("body-parser");

// File I/O
const fs = require("fs");

// load this app"s configuration data
const { colorNameTorgv } = require("./config-colors.js");

// load this app"s configuration data
const { teamNameToColorsMap } = require("./config-team.js");

// load this app's configuration data
const {
  maxRequestPerUser,
  idleCheckTimeout,
  idleColors,
  idleTeams,
} = require("./config.js");

const { Secrets } = require("./secrets.js");

//////////////////////////////////////////////////////////////////////////////
// Scenes
//////////////////////////////////////////////////////////////////////////////

const MessageScene = require("./MessageScene.js");

const messageScene = new MessageScene();

//////////////////////////////////////////////////////////////////////////////
// Data Managers
//////////////////////////////////////////////////////////////////////////////

const NameManager = require("./NameManager.js");
const SuggestionBox = require("./SuggestionBox.js");

const nameManager = new NameManager();
const suggestionBox = new SuggestionBox();

//////////////////////////////////////////////////////////////////////////////
// Create an ArtNet interface object and configure the universes
//////////////////////////////////////////////////////////////////////////////

const addresses = [ "192.168.1.140", "192.168.1.141", "192.168.1.142" ];
const universesPerAddress = 12;

for (let addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
  for (let universeIndex = 0; universeIndex < universesPerAddress; universeIndex++) {
    const universeConfiguration = {
      address: addresses[addressIndex],
      universe: universeIndex
    };

  console.log(`grizilla universeConfiguration=${JSON.stringify(universeConfiguration)}`);
  artnet.configureUniverse(universeConfiguration);
  }
}

//////////////////////////////////////////////////////////////////////////////
// Scene management
//////////////////////////////////////////////////////////////////////////////

let sceneIndex = -1;

function onSceneComplete()
{
  nextScene();
}

const drawTestScene = {
  name: "draw test",
  initialize: function() { return; },
  start: function() { return; },
  stop: function() { return; },
  callbackOnComplete: onSceneComplete,
}

const scenes = [
    drawTestScene
];


function nextScene() {

  scenes[sceneIndex].stop();

  if (++sceneIndex > 0) sceneIndex = 0;

  scenes[sceneIndex].start();
}

setScene();

setTimeout(nextStep, maxSceneTime);

//////////////////////////////////////////////////////////////////////////////
// the HTTP server
//////////////////////////////////////////////////////////////////////////////

const server = express();

server.use(bodyParser.urlencoded( { extended: true } ) );
server.use(bodyParser.json());

//////////////////////////////////////////////////////////////////////////////
// routing
//////////////////////////////////////////////////////////////////////////////

// ----- utilities -----
server.get("/status", function(request, response) {
  try {
    const messageCount = messageScene.getRequestCount();
    const activeCount = messageScene.getActiveMessagesCount();
    const queuedCount = messageScene.getQueuedMessagesCount();
    let message = `messages: requests=${messageCount} ready=${activeCount} future=${queuedCount}\n`;
    return fillResponse(request, response, "Okay", message);
  } catch (error) {
    let message = error.toString();
    return this.fillResponse(request, response, "Error", message);
  }
});

server.post("/names", function(request, response) {
  return nameManager.addName(request, response);
});

// check name
server.post("/names/:name", function(request, response) {
  return nameManager.checkName(request, response);
});

// ----- scenes -----

server.post("/greetings", function(request, response) {
  return greetingScene.addGreeting(request, response);
});

server.post("/messages", function(request, response) {
  return messageScene.addMessage(request, response);
});

server.post("/avatar", function(request, response) {
  return avatarScene.addAvatar(request, response);
});

server.get("/triviaQuestions", function(request, response) {
  return triviaScene.getQuesions(request, response);
});

server.post("/trivaResults", function(request, response) {
  return triviaScene.addName(request, response);
});

server.get("/pollQuestions", function(request, response) {
  return pollScene.addName(request, response);
});

server.get("/pollResults", function(request, response) {
  return pollScene.addName(request, response);
});

server.post("/suggetions", function(request, response) {
  return suggestionBox.addSuggestion(request, response);
});

server.get("/suggetions", function(request, response) {
  return suggestionBox.getSuggestions(request, response);
});

server.put("/snakeDirection", function(request, response) {
  return snakesScene.changeDirection(request, response);
});

server.put("/pongPosition", function(request, response) {
  return pongScene.changeDirection(request, response);
});


function fillResponse(request, response, status, message) {
  return response.json({
    status: status,
    message: message,
    source: "Gridzilla"
  });
}

//////////////////////////////////////////////////////////////////////////////
// the "start-up" code
//////////////////////////////////////////////////////////////////////////////

const port = process.env.PORT || 8000;

server.listen(port, function() {
  console.log("gridzilla server starting; listening on port " + port);
});
