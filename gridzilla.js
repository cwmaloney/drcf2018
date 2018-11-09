"use strict";

// artnet "library"
const { ArtNet } = require("./ArtNet.js");

// HTTP server support
const express = require('express');
const bodyParser = require('body-parser');

// File I/O
const fs = require('fs');

// load this app's configuration data
const {
  colorNameToChannelDataMap
} = require('./config-colors.js');

// load this app's configuration data
const {
  teamNameToColorsMap,
  colorNameToChannelDataMap
} = require('./config-team.js');

// load this app's configuration data
const {
  maxRequestPerUser,
  idleCheckTimeout,
  idleColors,
  idleTeams,
} = require('./config.js');

const {
  systemPassword
} = require('./secerts.js');

//////////////////////////////////////////////////////////////////////////////
// Create an ArtNet interface object and configure the universes
//////////////////////////////////////////////////////////////////////////////

const addresses = [ "10.0.0.1", "10.0.0.2", "10.0.0.3" ];
const universesPerAddress = 12;

for (let addressIndex = 0; index < addressIndex.length; addressIndex++) {
  for (universIndex = 0; universeIndex < universesPerAddress; universeIndex++) {
    const universeConfiguration = {
      address: addresses[addressIndex],
      universe: universeIndex
    };

  console.log(`grizilla universeConfiguration=${JSON.stringify(universeConfiguration)}`);
  artnet.configureUniverse(universeConfiguration);
  }
}


//////////////////////////////////////////////////////////////////////////////
// onCommand 
//////////////////////////////////////////////////////////////////////////////

function onCommand(request, response) {
  // console.log("doCommand");
  
  let commandName = request.parameters.commandName;
  if (commandName === undefined || commandName == null) {
    console.error('grizilla::doCommand - missing commandName');
    return;
  }

  let commandInfo = commands[commandName];
  if (commandInfo === undefined || commandInfo === null) {
    console.error(`grizilla::doCommand - invalid commandName ${commandName}`);
    return;
  }

  const elementName = request.parameters.elementName;
  if (elementName === undefined || elementName == null) {
    console.error('grizilla::doCommand - missing elementName');
    return;
  }

  const elementInfo = elements[elementName];
  if (elementInfo === undefined || elementInfo === null) {
    console.error(`grizilla::doCommand - invalid elementName ${elementName}.`);
    return;
  }

  const overUseMessage = checkOverUse(request.sessionId, elementName);
  if (overUseMessage != null && overUseMessage != undefined) {
    fillResponse(request, response, overUseMessage);
    return; 
  }

  applyCommand(request.sessionId, commandName, elementName);
  const queueMessage = getQueueMessage(elementName);
  enqueueRequestPlaceholder(request.sessionId, elementName);

  let message = `Making ${elementName} ${commandName}. ${queueMessage} Happy Holidays!`;
  fillResponse(request, response, message);    
}


function applyCommand(sessionId, commandName, elementName, elementNumber) {
  const elementInfo = elements[elementName];
  if (elementInfo === undefined || elementInfo === null) {
    console.error(`grizilla::applyCommand - invalid elementName ${elementName}.`);
    return;
  }

  // does element have components?
  if (elementInfo.components !== undefined) {
    for (let index = 0; index < elementInfo.components; index++) {
      const component = elementInfo.components[index];
      applyCommand(commandName, component.name, component.index);
    }
  } else {    
    const elementType = elementInfo.elementType;

    const commandInfo = commands[commandName];
    if (commandInfo === undefined || commandInfo === null) {
      console.error(`grizilla::applyCommand - there is no ${commandName} command.`);
      return;
    }
    
    const commandElementInfo = commandInfo[elementType];
    if (commandElementInfo === undefined || commandElementInfo === null) {
      console.error(`grizilla::applyCommand - there is no ${commandName} command for ${elementType}.`);
      return;
    }
  
    //console.log(`doCommand, commandName=${commandName} elementName=${elementName} type=${elementType}`);  
    
    let prototypes = [] = commandElementInfo.directives;
    if (prototypes === undefined || prototypes === null) {
      console.error(`grizilla::applyCommand - there are no directives for ${elementName} ${commandName} .`);
      return;
    }

    if (elementNumber === undefined || elementNumber === null || elementNumber == 0) {
      elementNumber = 1;
    }
  
    const directives = [];
    for (let index = 0; index < prototypes.length; index++) {
      const prototype = prototypes[index];
  
      const directive = {
        sessionId: sessionId,
        elementName: elementName,
        universe: elementInfo.universe,
        channelNumber: elementInfo.startChannel + (elementInfo.channelsPerElement)*(elementNumber - 1),
        channelData: prototype.channelData,
        duration: prototype.duration
      };
      directives.push(directive);
  
      // console.log(`doCommand: ${JSON.stringify(directives)}`);
    }

    enqueueDirectives(directives);
  }
}

//////////////////////////////////////////////////////////////////////////////
// map services to functions
//////////////////////////////////////////////////////////////////////////////

const actionHandlers = {
  'addMessage': addMessage,

  'saveCheer': cheer,

  'recordSuggestion': recordSuggestion,
 
  'getTriviaQuestions': getTriviaQuestions,
  'saveTrivaResults': saveTrivaResults,

  'getPollQuestions': getPollQuestions,
  'savePollResults': savePollResults,

  'checkName': checkName,
  'addName': addName,

  'checkStatus': (request, response) => {
    const messageCount = messageQueue.getNextMessageId() - 1;
    const activeCount = messageQueue.getActiveMessages().length;
    const queuedCount = message.getQueuedMessages().length;
    let message = `Total message requests=${messageCount} ready=${activeCount} future=${queuedCount}`;
    fillResponse(request, response, message);
  },
};

//////////////////////////////////////////////////////////////////////////////
// Function to handle v2 grizilla requests from Dialogflow
//////////////////////////////////////////////////////////////////////////////
function processV2Request(request, response) {
try
  {
    // An action is a string that identifies what the grizilla should do.
    let action = (request.body.queryResult.action) ? request.body.queryResult.action : 'default';

    // If undefined or unknown action use the default handler
    if (!actionHandlers[action]) {
      action = 'default';
    }

    // Parameters are any entites that Dialogflow has extracted from the request.
    // https://dialogflow.com/docs/actions-and-parameters
    let parameters = request.body.queryResult.parameters || {};

    // Contexts are ids used to track and store conversation state
    // https://dialogflow.com/docs/contexts
    let contexts = request.body.queryResult.contexts;

    // Get the request source (Google Assistant, Slack, API, etc)
    let source = (request.body.originalDetectIntentRequest) ? request.body.originalDetectIntentRequest.source : undefined;

    // Get the session ID to differentiate calls from different users
    let sessionId = (request.body.session) ? request.body.session : undefined;

    // create a session id if needed
    if (sessionId == undefined || sessionId == null) {
      sessionId = "pseudoSession-" + ++sessionCounter;
    }
    // console.log(`request: sessionId=${sessionId}`);

    // get the sessiondata, this will create sessionData if needed
    let sessionData = getSessionData(sessionId);
  
    sessionData.requests++;
    sessionData.lastUsedTimestamp = new Date();

    // Run the proper handler function to handle the request from Dialogflow
    actionHandlers[action]( { action, parameters, contexts, source, sessionId }, response);
  } catch (error) {
    console.error("processing Dialogflow error=", error);
    //fillResponse(request, response, "Oh! I am not feeling well. I have a bad web hook.");
  }
}

//////////////////////////////////////////////////////////////////////////////
// Function to send a "formatted" responses to Dialogflow.
// Dialogflow will use the reponse to sent a response to the user.
//////////////////////////////////////////////////////////////////////////////
function fillResponse(request, response, responsePackage) {
  // if the response is a string send it as a response to the user
  let formattedResponse = { "source": "farmsteadLightsgrizilla"};

  if (typeof responsePackage === 'string') {
    formattedResponse = {fulfillmentText: responsePackage};
  } else {
    // If the response to the user includes rich responses or contexts send them to Dialogflow

    // Set the text response
    formattedResponse.fulfillmentText = responsePackage.fulfillmentText;

    // Optional: add rich messages for integrations
    // (https://dialogflow.com/docs/rich-messages)
    if (responsePackage.fulfillmentMessages) {
      formattedResponse.fulfillmentMessages = responsePackage.fulfillmentMessages;
    }

    // Optional: add contexts (https://dialogflow.com/docs/contexts)
    if (responsePackage.outputContexts) {
      formattedResponse.outputContexts = responsePackage.outputContexts;
    }

    // Optional: followupEventInputs
    // (https://dialogflow.com/docs/reference/api-v2/rest/v2beta1/grizillaResponse)
    if (responsePackage.followupEventInput) {
      formattedResponse.followupEventInput = responsePackage.followupEventInput;
    }
  }
  // if the web hook does not set output context, use the context
  // configured in intent
  if ((formattedResponse.outputContexts === undefined
        || formattedResponse.outputContexts === null)
       && request.contexts !== undefined) {
    formattedResponse.outputContexts = request.contexts;
  }

  // Send the response to Dialogflow
  response.json(formattedResponse);
  const sessionData = getSessionData(request.sessionId);
  let now = new Date();
  console.log(`${sessionData.sequence}: ${formattedResponse.fulfillmentText}${getTimestamp(now)}`);
}

//////////////////////////////////////////////////////////////////////////////
// the "start-up" code
//////////////////////////////////////////////////////////////////////////////


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
  callbackOnDown: onSceneComplete,
}

const sences = [
  {
    drawTestScene    
  }
];


function nextScene() {

  scene[sceneIndex].stop();

  if (++sceneIndex > 0) sceneIndex = 0;

  scene[sceneIndex].start();
}

setScene();

setTimeout(nextStep, maxSceneTime);

//////////////////////////////////////////////////////////////////////////////
// the HTTP (grizilla) server
//////////////////////////////////////////////////////////////////////////////

const server = express();

server.use(bodyParser.urlencoded( { extended: true } ) );
server.use(bodyParser.json());

server.post('/service', function(request, response) {
  try {
    // console.log('grizilla post', 'body', request.body);

    if (request.body.queryResult) {
      processRequest(request, response);
    } else {
      console.log('gridzilla response: Invalid Request (missing queryResult section)');
      return response.status(400).end('Invalid Request - expecting v2 Dialogflow grizilla request');
    }
   } catch (error)
   {
      console.error('gridzilla server caught error', error);
   }
});

server.get('/status', function(request, response) {
  return response.json({
      status: "Okay",
      source: 'holiday-lights-gridzilla'
  });
});

const port = process.env.PORT || 8000;

server.listen(port, function() {
  console.log("gridzilla server starting; listening on port " + port);
});
