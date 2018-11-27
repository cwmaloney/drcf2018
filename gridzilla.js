"use strict";

// HTTP server support
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const uuidv4 = require('uuid/v4');

//////////////////////////////////////////////////////////////////////////////
// const GridzillaTransform = require("./GridzillaTransform.js");
const GridzillaTransform = require("./EmulatorTransform.js"); // for debugging

const gridzilla = new GridzillaTransform();

// const FrameBuffer = require("./FrameBuffer.js");
// var frame = new FrameBuffer(168, 36);

const BitmapBuffer = require("./BitmapBuffer.js");

//////////////////////////////////////////////////////////////////////////////
// Scenes
//////////////////////////////////////////////////////////////////////////////

const BannerScene = require("./BannerScene.js");
const MessageScene = require("./MessageScene.js");
const CheersScene = require("./CheersScene.js");

//////////////////////////////////////////////////////////////////////////////
// Managers
//////////////////////////////////////////////////////////////////////////////

const NameManager = require("./NameManager.js");

const nameManager = new NameManager();
console.log(`loading names  @${new Date()} ...`);
nameManager.loadNameLists();
console.log(`loading names complete  @${new Date()}`);

const SuggestionManager = require("./SuggestionManager.js");
const suggestionManager = new SuggestionManager();

//////////////////////////////////////////////////////////////////////////////
// Scene management
//////////////////////////////////////////////////////////////////////////////

let sceneIndex = -1;
let pauseTimer = null;
let forcePauseTimer = null;

const scenePeriod = 60000;
const pauseWaitPeriod = 11000;

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

  console.log("running scene "+ sceneIndex);
  scenes[sceneIndex].run();

  pauseTimer = setTimeout(pauseScene, scenePeriod);
}

// create scenes
const welcomeBanner = new BannerScene(gridzilla, onPaused, { line1: "Welcome to", line2: "Holiday Lights", line3: "on Farmstead Lane" } );
const instructionsBanner = new BannerScene(gridzilla, onPaused, { line1: "Tune to 90.5", line2: "to hear the music.", line3: "Please turn off your lights."} );
const instructions2Banner = new BannerScene(gridzilla, onPaused, { line1: "(coming soon)", line2: "Visit farmsteadlights.com", line3: "to play games on Gridzilla" } );
//const instructions3Banner = new BannerScene(gridzilla, onPaused, { line1: "More songs coming soon" } );
const messagesScene = new MessageScene(gridzilla, onPaused, nameManager, {});
const cheersScene = new CheersScene(gridzilla, onPaused, nameManager, {});

const scenes = [
  welcomeBanner,

  instructionsBanner,
  instructions2Banner,

  messagesScene,
  cheersScene
];

//////////////////////////////////////////////////////////////////////////////
// the HTTP server
//////////////////////////////////////////////////////////////////////////////

const server = express();

server.use(bodyParser.urlencoded( { extended: true } ) );
server.use(bodyParser.json());
server.use(cors());

//////////////////////////////////////////////////////////////////////////////
// routing
//////////////////////////////////////////////////////////////////////////////

// ----- utilities -----
server.get("/status", function(request, response) {
  try {
    const messageCount = messagesScene.getRequestCount();
    const activeCount = messagesScene.getActiveMessageCount();
    const queuedCount = messagesScene.getQueuedMessageCount();
    const messages = { ready: activeCount, queued: queuedCount, requests: messageCount }
    const suggestions = { count: suggestionManager.getSuggestions().length }
    return response.json({
      messages,
      suggestions
    });
  } catch (error) {
    return response.json({
      status: "Error",
      error: error.toString()
    });
  }
});

function checkSessionId(request, response) {
  if (!request.body.sessionId) {
    request.body.sessionId = uuidv4();
  }
}

server.post("/names", function(request, response) {
  return nameManager.addName(request, response);
});

// check name
server.post("/names/:name", function(request, response) {
  return nameManager.checkName(request, response);
});

// ----- scenes -----

server.post("/messages", function(request, response) {
  checkSessionId(request, response);
  return messagesScene.addMessage(request, response);
});

server.post("/cheers", function(request, response) {
  checkSessionId(request, response);
  return cheersScene.addGreeting(request, response);
});

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

server.post("/suggestions", function(request, response) {
  return suggestionManager.addSuggestion(request, response);
});

server.get("/suggestions", function(request, response) {
  try {
    const suggestions = suggestionManager.getSuggestions();
    return response.json({
        suggestions
    });
  } catch (error) {
    return response.json({
      status: "Error",
      error: error.toString()
    });
  }
});

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
