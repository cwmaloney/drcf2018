"use strict";

// HTTP server support
const Express = require("express");
const Http = require("http");
const SocketIo = require("socket.io");

const BodyParser = require("body-parser");
const Cors = require("cors");

const Uuidv4 = require('uuid/v4');
const EnvConfig = require("./envConfig.js");
const TransformFactory = require("./TransformFactory.js");

const BitmapBuffer = require("./BitmapBuffer.js");

const Color = require("./Color.js");
const { colorNameToRgb } = require("./config-colors.js");

//////////////////////////////////////////////////////////////////////////////
// Scenes
//////////////////////////////////////////////////////////////////////////////

const BannerScene = require("./BannerScene.js");
const MessageScene = require("./MessageScene.js");
const CheerScene = require("./CheerScene.js");
const ImageScene = require("./ImageScene.js");
// const SnakesScene = require("./SnakesScene.js");
const ScrollingTextScene = require("./ScrollingTextScene.js");

//////////////////////////////////////////////////////////////////////////////
// Managers
//////////////////////////////////////////////////////////////////////////////

const ImageManager = require("./ImageManager.js");
const NameManager = require("./NameManager.js");

const nameManager = new NameManager();
console.log(`loading names  @${new Date()} ...`);
nameManager.loadNameLists();
console.log(`loading names complete  @${new Date()}`);

const SuggestionManager = require("./SuggestionManager.js");
const suggestionManager = new SuggestionManager();
suggestionManager.loadSuggestions();

//////////////////////////////////////////////////////////////////////////////
// Scene management
//////////////////////////////////////////////////////////////////////////////

let sceneIndex = -1;
let pauseTimer = null;
let forcePauseTimer = null;

const scenePeriod = 300000; // 5 minutes
const pauseWaitPeriod = 15000; // 15 seconds

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

  //console.log("running scene "+ sceneIndex);

  //set the timeout before telling the scene to run
  //if the scene has nothing to do, it will call onPause and cancel the timeout
  pauseTimer = setTimeout(pauseScene, scenePeriod);
  scenes[sceneIndex].run();
}

// create scenes
let messagesScene;
let cheersScene;
// Array of scenes, initialized at start up
let scenes;


//////////////////////////////////////////////////////////////////////////////
// the HTTP server
//////////////////////////////////////////////////////////////////////////////

// the name "app" follows the Express "naming convention"
const app = Express();
const server = Http.Server(app);

app.use(BodyParser.urlencoded( { extended: true } ) );
app.use(BodyParser.json());
app.use(Cors());
//app.options('*', Cors());

// the name "io" follows the Socket.io "nameing convention"
const io = SocketIo(server);
//io.set('origins', '*:*');
io.origins((origin, callback) => {
  callback(null, true);
});

//////////////////////////////////////////////////////////////////////////////
// routing
//////////////////////////////////////////////////////////////////////////////

// ----- utilities -----
app.get("/status", function(request, response) {
  try {
    const messages = {
      ready: messagesScene.getActiveRequestCount(),
      queued: messagesScene.getQueuedRequestCount(),
      requests: messagesScene.getRequestCount()
    };

    const cheers = {
      ready: cheersScene.getActiveRequestCount(),
      queued: cheersScene.getQueuedRequestCount(),
      requests: cheersScene.getRequestCount()
    };

    const suggestions = { count: suggestionManager.getSuggestions().length }

    return response.json({
      messages,
      cheers,
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
    request.body.sessionId = Uuidv4();
  }
}

app.post("/names", function(request, response) {
  return nameManager.addName(request, response);
});

// check name
app.post("/names/:name", function(request, response) {
  return nameManager.checkName(request, response);
});

// ----- scenes -----

app.post("/messages", function(request, response) {
  checkSessionId(request, response);
  return messagesScene.addMessage(request, response);
});

app.get("/messages", function(request, response) {
  try {
    const queue = messagesScene.getMessageQueue();
    return response.json({
      queue
    });
  } catch (error) {
    return response.json({
      status: "Error",
      error: error.toString()
    });
  }
});

app.post("/cheers", function(request, response) {
  checkSessionId(request, response);
  return cheersScene.addCheer(request, response);
});

app.get("/cheers", function(request, response) {
  try {
    const queue = cheersScene.getCheerQueue();
    return response.json({
      queue
    });
  } catch (error) {
    return response.json({
      status: "Error",
      error: error.toString()
    });
  }
});

// app.post("/avatars", function(request, response) {
//   return avatarScene.addAvatar(request, response);
// });

// app.get("/triviaQuestions", function(request, response) {
//   return triviaScene.getQuesions(request, response);
// });

// app.post("/trivaResults", function(request, response) {
//   return triviaScene.addName(request, response);
// });

// app.get("/pollQuestions", function(request, response) {
//   return pollScene.addName(request, response);
// });

// app.get("/pollResults", function(request, response) {
//   return pollScene.addName(request, response);
// });

app.post("/suggestions", function(request, response) {
  return suggestionManager.addSuggestion(request, response);
});

app.get("/suggestions", function(request, response) {
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

//////////////////////////////////////////////////////////////////////////////
// scence configuration
//////////////////////////////////////////////////////////////////////////////

const gridzillaDefaults = {
  scrollSceneDefaultsWithHeader: {
    headerTextTop: 3,
    scrollTextTop: 18,
    typeface: "Littera",
    fontSize: 11,
    speed: 30    
  },
  scrollSceneDefaultsNoHeader: {
    scrollTextTop: 10,
    typeface: "Littera",
    fontSize: 11,
    speed: 30
    }
};

const facadeDefaults = {
  scrollSceneDefaultsWithHeader: {
    headerTextTop: 2*14 - 2,
    scrollTextTop: 3*14 - 2,
    typeface: "Littera",
    fontSize: 14,
    speed: 60
  },
  scrollSceneDefaultsNoHeader: {
    scrollTextTop: 3*14 - 2,
    typeface: "Littera",
    fontSize: 14,
    speed: 60
    }
};

const teamMembers = 
  "   Mark Callegari - The Creator of Holiday Lights,"
+ " Chris Callegari,"
+ " Blake Stewart,"
+ " Chris & Rachel Maloney,"
+ " Ken & Min Vrana,"
+ " Kyle Weafer,"
+ " Foley Equipment"
+ " Pretech Precast Concrete"
+ " Enerfab Midwest (Brian Jackson, Steve Bullard),"
+ " T.J. Kilian and KJO Media, "
+ " Jolt Lighting,"
+ " Gieske Custom Metal Fabricators,"
+ " The Farmstead Team:"
+ " Jerry, Walt, Virgil, Kathi, Laurie, Orrin, Matt"
+ " & John Webb"
+ "    ";

function configureHolidayScenes(gridzilla) {
  ImageScene.initialize();

  // create scenes
  const welcomeBanner = new BannerScene(gridzilla, onPaused,
    {
      line1: "Welcome to",
      line2: "Holiday Lights",
      line3: "on Farmstead Lane   ",
      color: new Color(colorNameToRgb["White"])
    });

  const instructionsBanner = new BannerScene(gridzilla, onPaused,
    {
      line1: "Tune to 90.5",
      line2: "to hear the music.",
      line3: "Please turn off your lights.",
      color: new Color(colorNameToRgb["White"])
    });

  const instructions2Banner = new BannerScene(gridzilla, onPaused,
    {
      line1: "Visit farmsteadlights.com",
      line2: "to display messages here.",
      line3: "Thanks for coming!",
      color: new Color(colorNameToRgb["White"])
    });

    
  const holidaySampleMessages = [
    { sample: true, recipient: "Everyone", message: "Happy Holidays", sender: "the Holiday Lights Team" },
    { sample: true, recipient: "Everyone", message: "Live Long and Prosper", sender: "Spock" }, 
    { sample: true, recipient: "Mila and Emmy", message: "Merry Christmas", sender: "Rachel and Chris" }, 
  ];

  messagesScene = new MessageScene(gridzilla, null, onPaused, nameManager,
    {
      sampleMessages: holidaySampleMessages
    });

  cheersScene = new CheerScene(gridzilla, onPaused, nameManager, {});
  //show special images

  // const imageScene1 = new ImageScene(gridzilla, onPaused,
  //   { period: 10000, images:["Go Chiefs.png"]});

  //show standard images
  const imageScene2 = new ImageScene(gridzilla, onPaused,
    { period: 10000 });


  // const preSnakesBanner = new BannerScene(gridzilla, onPaused,
  //   {
  //     line1: "Let's Play Snakes!",
  //     line2: "Go to farmsteadlights.com",
  //     line3: "to play snakes here.",
  //     color: new Color(colorNameToRgb["Orange"])
  //   } );
  // const snakeScene = new SnakesScene(gridzilla, onPaused, nameManager, io, {});


  const thankYouScene = new ScrollingTextScene(gridzilla, null, onPaused,
    {
      period: 180*60*1000, headerText: "Thanks!",
      scrollText: teamMembers, minimumInterval: 5*60*1000
    },
    Object.assign(gridzillaDefaults.scrollSceneDefaultsWithHeader,
      {color: new Color(255, 200, 200)} ),
    Object.assign(facadeDefaults.scrollSceneDefaultsWithHeader,
      {color: new Color(255, 200, 200)} )
  );
  
  scenes = [
    welcomeBanner,
    instructionsBanner,
    instructions2Banner,
    messagesScene,
    cheersScene,
    // imageScene1,
    imageScene2,
    // preSnakesBanner,
    // snakeScene,
    thankYouScene
  ];

}

function configureValentineScenes(gridzilla, facade) {
  ImageScene.initialize();

  const vDayImageNames = [
    "couple and hearts.png",
    "heart 25x20.png",
    "rose 38x38.png",
    "woodstock 38x38.png"
  ];

  const vDaySampleMessages = [
    { sample: true, recipient: "Rachel", message: "Will you be my Valentine?", sender: "Chris" },
    { sample: true, recipient: "Sheldon", message: "I love you", sender: "Amy" },
    { sample: true, recipient: "Lucy", message: "Will you be my Valentine?", sender: "Charlie" },
    { sample: true, recipient: "Everyone", message: "Live Long and Prosper", sender: "Spock" }, 
    { sample: true, recipient: "Mom", message: "Happy Valentine's Day", sender: "Kyle" }
  ];
  
  // create scenes
  const welcomeScene = new ScrollingTextScene(gridzilla, facade, onPaused,
    {
      imageNames: vDayImageNames,
      scrollText: "             "
        + " Happy Valentine's Day!    "
        + " Visit farmsteadlights.com to display your Valentine here."
        + "             "
    },
    Object.assign(gridzillaDefaults.scrollSceneDefaultsNoHeader,
      {color: new Color(255, 200, 200)} ),
    Object.assign(facadeDefaults.scrollSceneDefaultsNoHeader,
      {color: new Color(255, 200, 200)} )
  );

  messagesScene = new MessageScene(gridzilla, facade, onPaused, nameManager,
    {
      imageNames: vDayImageNames,
      sampleMessages: vDaySampleMessages    
    },
    {},
    facadeDefaults.scrollSceneDefaultsNoHeader
  );

  scenes = [
    welcomeScene,
    messagesScene
  ];

}

function configureEosScenes(gridzilla, facade) {
  ImageScene.initialize();

  const eosImageNames = [
    "rose 38x38.png"
  ];

  // create scenes
  const eosMessageScene = new ScrollingTextScene(gridzilla, facade, onPaused,
    {
      imageNames: eosImageNames,
      scrollText: "             "
       + "Thank you for visiting the Holiday Lights show.  "
       + "The show has ended for the season. "
       + "Deanna Rose Children's Farmstead will reopen April 1st!"
       + "                "
    },
    Object.assign(gridzillaDefaults.scrollSceneDefaultsNoHeader,
      {color: new Color(255, 200, 200)} ),
    Object.assign(facadeDefaults.scrollSceneDefaultsNoHeader,
      {color: new Color(255, 200, 200)} )
  );

  const thankYouScene = new ScrollingTextScene(gridzilla, facade, onPaused,
    {
      period: 180*60*1000, headerText: "Thanks!",
      scrollText: teamMembers, minimumInterval: 5*60*1000
    },
    Object.assign(gridzillaDefaults.scrollSceneDefaultsWithHeader,
      {color: new Color(255, 200, 200)} ),
    Object.assign(facadeDefaults.scrollSceneDefaultsWithHeader,
      {color: new Color(255, 200, 200)} )
  );

  scenes = [
    eosMessageScene,
    thankYouScene
  ];

}
//////////////////////////////////////////////////////////////////////////////
// the "start-up" code
//////////////////////////////////////////////////////////////////////////////

const port = process.env.PORT || 8000;

EnvConfig.loadOverrides();

BitmapBuffer.initializeFonts().then( () =>  {
  ImageManager.initialize().then( () => {
    let gridzilla = TransformFactory.getGridzillaTransform();
    let facade = TransformFactory.getFacadeTransform();

    // configure the scenes
    let show = EnvConfig.get().show;
    if (!show) {
      show = "Holiday";
    }
    if (show === "Valentine")
      configureValentineScenes(gridzilla, facade);
    else if (show === "Holiday")
      configureHolidayScenes(gridzilla);
    else if (show === "EOS")
    configureEosScenes(gridzilla, facade);

    startListening();
  });
});

function startListening() {

  // Socket.io initialization

  io.on("connection", function(socket) {
    console.log("Socket.io user connection: " + socket.id);

    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
      const scene = scenes[sceneIndex];
      if (scene.onUserConnected) {
        scene.onUserConnected(socket);
      }
    }

    socket.on("disconnect", function(error) {
      console.log(`Socket.io user disconnected: ${socket.id} error=${error.toString}`);

      for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
        const scene = scenes[sceneIndex];
        if (scene.onUserDisconnected) {
          scene.onUserDisconnected(socket);
        }
      }
    });

  });

  // start the server
  server.listen(port, function() {
    console.log("Holiday Lights server listening on port " + port);
  });

  startNextScene();
}
