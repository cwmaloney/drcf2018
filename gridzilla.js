"use strict";

// HTTP server support
const express = require("express");
const bodyParser = require("body-parser");

// // load this app"s configuration data
// const { colorNameToRgb } = require("./config-colors.js");

// // load this app"s configuration data
// const { teamNameToColorsMap } = require("./config-team.js");

// // load this app's configuration data
// const {
//   maxRequestPerUser,
//   idleCheckTimeout,
//   idleColors,
//   idleTeams,
// } = require("./config.js");

//////////////////////////////////////////////////////////////////////////////
// const GridzillaTransform = require("./GridzillaTransform.js");
// const GridzillaTransform = require("./EmulatorTransform.js"); // for debugging

const gridzilla = new GridzillaTransform();

// const FrameBuffer = require("./FrameBuffer.js");
// var frame = new FrameBuffer(168, 36);

const BitmapBuffer = require("./BitmapBuffer.js");

//////////////////////////////////////////////////////////////////////////////
// Scenes
//////////////////////////////////////////////////////////////////////////////

const MessageScene = require("./MessageScene.js");
const BannerScene = require("./BannerScene.js");

//////////////////////////////////////////////////////////////////////////////
// Data Managers
//////////////////////////////////////////////////////////////////////////////

const NameManager = require("./NameManager.js");
//const SuggestionBox = require("./SuggestionBox.js");

const nameManager = new NameManager();

console.log(`loading names  @${new Date()} ...`);
nameManager.loadNameLists();
console.log(`loading names complete  @${new Date()}`);

//const suggestionBox = new SuggestionBox();

//////////////////////////////////////////////////////////////////////////////
// Scene management
//////////////////////////////////////////////////////////////////////////////

let sceneIndex = -1;
let pauseTimer = null;
let forcePauseTimer = null;

const scenePeriod = 10000;
const pauseWaitPeriod = 5000;

function onPaused()
{
  if (pauseTimer) {
    clearTimeout(pauseTimer);
    pauseTimer = null;
  }
  if (forcePauseTimer) {
    clearTimeout(forcePauseTimer);
    forcePauseTimer = null;
  }
  startNextScene();
}

function forcePause() {
  scenes[sceneIndex].forcePause();
}

function pauseScene() {
  scenes[sceneIndex].pause();

  forcePauseTimer = setTimeout(forcePause, pauseWaitPeriod);
}

function startNextScene() {

  if (++sceneIndex >= scenes.length) sceneIndex = 0;

  scenes[sceneIndex].run();

  pauseTimer = setTimeout(pauseScene, scenePeriod);
}

// create scenes
const welcomeBanner = new BannerScene(gridzilla, onPaused, {line1: "Welcome to", line2: "Holiday Lights", line3: "on Farmstead Lane", period: 3000} );
const instructionsBanner = new BannerScene(gridzilla, onPaused, { line1: "Tune to 90.5", line2: "to hear the music", line3: "More songs coming soon"} );
const instructions2Banner = new BannerScene(gridzilla, onPaused, { line1: "(coming soon)", line2: "Visit farmsteadlights.com", line3: "to play games on Gridizilla" } );
//const instructions3Banner = new BannerScene(gridzilla, onPaused, { line1: "More songs coming soon" } );
const messageScene = new MessageScene(gridzilla, onPaused, nameManager);

const scenes = [
  welcomeBanner,

  instructionsBanner,
  instructions2Banner
  //instructions3Banner,
  //messageScene
];

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

server.post("/messages", function(request, response) {
  return messageScene.addMessage(request, response);
});

// server.post("/cheers", function(request, response) {
//   return cheersScene.addGreeting(request, response);
// });

// server.post("/avatars", function(request, response) {
//   return avatarScene.addAvatar(request, response);
// });

// server.get("/triviaQuestions", function(request, response) {
//   return triviaScene.getQuesions(request, response);
// });

// server.post("/trivaResults", function(request, response) {
//   return triviaScene.addName(request, response);
// });

// server.get("/pollQuestions", function(request, response) {
//   return pollScene.addName(request, response);
// });

// server.get("/pollResults", function(request, response) {
//   return pollScene.addName(request, response);
// });

// server.post("/suggestions", function(request, response) {
//   return suggestionBox.addSuggestion(request, response);
// });

// server.get("/suggestions", function(request, response) {
//   return suggestionBox.getSuggestions(request, response);
// });

// server.post("/snakes", function(request, response) {
//   return snakesScene.changeDirection(request, response);
// });

// server.put("/snake/:snakeId", function(request, response) {
//   return snakesScene.changeDirection(request, response);
// });

// server.post("/pongPlayers", function(request, response) {
//   return snakesScene.changeDirection(request, response);
// });

// server.put("/pongPaddle:paddleId", function(request, response) {
//   return pongScene.changeDirection(request, response);
// });


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

BitmapBuffer.initializeFonts().then( () =>  {
  
  startNextScene();

});

server.listen(port, function() {
  console.log("gridzilla server starting; listening on port " + port);
});
