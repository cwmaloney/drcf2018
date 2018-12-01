// Snake socket API
"use strict";

const Http = require("http");
const SocketIo = require("socket.io");
const TimestampUtilities = require("./TimestampUtilities.js");

const BitmapBuffer = require("./BitmapBuffer.js");
const Jimp = require("jimp");

const Font = require("./Font.js");
const Color = require("./Color.js");

const { colorNameToRgb } = require("./config-colors.js");

// ----- constants -----

const playerColors = [ "Red", "Blue", "Green", "Yellow", "Purple", "Orange", "White" ];

// key codes
const KeyCodes = {
  left: 37,
  up: 38,
  right: 39,
  down: 40
};

const Direction = {
  up: "up",
  down: "down",
  left: "left",
  right: "right"
};

// ----- Game -----

let nextGameId = 1;

class Game {

  constructor(server, maxPlayers) {
    this.server = server;
    this.gameId = nextGameId++;
    this.maxPlayers = maxPlayers;

    this.timeout = 1000;

    this.players = new Map();
  }

  addPlayer(player) {
    if (this.players.size >= this.maxPlayers) {
      throw "To many players added to game";
    }
    const color = playerColors[this.players.size];
    this.players.set(player.id, player.name, color);
  }

  sendMessage() {

  }

  addSnacks() {
    let count = Math.max(3, this.players.length);
    if (!this.snacks) {
      this.snacks = [];
    }
    for (let index = this.snacks.length; index < count; index++) {
      const x = (Math.random() * (this.gridWidth - 3) + 1);
      const y = (Math.random() * (this.gridHeight - 3) + 1);
      if (this.game.board.isEmpty(x, y)) {
        this.snackes.push({x, y});
      }
    }
  }

  createSnakes() {
    for (let index = 0; index < this.players.length; index++) {
      const player = this.players[index];
      const snake = new Snake(this, player);
      this.snakes.push(snake);
      snake.initialize();
    }
  }

  start() {
    this.createSnakes();
    this.addFood();
    
    this.startGameStartTimestamp = TimestampUtilities.getNowTimestampNumber();

    this.timer = setTimeout(this.onTimer.bind(this), this.timeout);
    this.running = true;
  }

  onTimer() {
    // move snakes
    for (let snakeIndex = 0; snakeIndex < this.snakes.length; snakeIndex++) {
      const snake = this.snakes[snakeIndex];
      snake.move();
    }

    // check for touches
    for (let snakeIndex = 0; snakeIndex < this.snakes.length; snakeIndex++) {
      const snake = this.snakes[snakeIndex];
      snake.checkTouches();
    }

    this.addSnacks();

    // send status to all players
    this.sendStatus();
      
    this.timer = setTimeout(this.onTimer.bind(this), this.timeout); 
  }

  sendStatus() {
    this.server.socket.emit("state", {
      snakes: this.snakes.map((snake) => ({
        id : snake.player.id,
        color : snake.player.color,
        x: snake.x,
        y: snake.y ,
        tail: snake.tail
      })),
      snacks: this.snacks
    });
  }

  findSnake(playerId) {
    for (let snakeIndex = 0; snakeIndex < this.snakes.length; snakeIndex++) {
      const snake = this.snakes[snakeIndex];
      if (snake.playerId == playerId) {
        return snake;
      }
    }
    return null;
  }

  onKeyPress(message) {
    const snake = this.findSnake(message.playerId);
    if (snake) {
      snake.onKeyPress(message);
    }
  }

  stop() {
    this.running = true;
    
    this.stopGameStartTimestamp = TimestampUtilities.getNowTimestampNumber();
  }
}


// ----- Snake -----

class Snake {

  constructor(game, player) {
    this.game = game;
    this.player = player;
  }
 
  initialize() {
    const maxTries = this.game.boardWidth * this.game.boardHeight;
    for (let tryIndex = 0; tryIndex < maxTries; tryIndex++) {
      const headX = (Math.random() * (this.gridWidth - 3) + 1);
      const headY = (Math.random() * (this.gridHeight - 3) + 1);
      if (this.game.board.isEmpty(headX, headY)) {
        const tailY = headY;
        let tailX;
        if (headX < this.gridWidth/2) {
          tailX = headX - 1;
          this.direction = Direction.right;
        } else {
          tailX = headX + 1;
          this.direction = Direction.left;
        }
        if (!this.game.board.isEmpty(headX, headY)) {
          this.x = headX;
          this.y = headY;
          this.tail[0] = { x: tailX, y: tailY };
          break;
        }
      }
    }
  }

  onKeyPress(key) {
    switch (key) {
      case KeyCodes.up:
        if (this.direction !== Direction.down) {
          this.direction = Direction.down;
        }
        break;
      case KeyCodes.right:
        if (this.direction !== Direction.left) {
          this.direction = Direction.right;
        }
        break;
      case KeyCodes.down:
        if (this.direction !== Direction.up) {
          this.direction = Direction.down;
        }
        break;
      case KeyCodes.left:
        if (this.direction !== Direction.right) {
          this.direction = Direction.left;
        }
      break;
    }
  }

  move() {
    // remove the last tail segment
    for(let index = 1; index < this.tail.length; index++) {
      this.tail[index].x = this.tail[index-1].x;
      this.tail[index].y = this.tail[index-1].y;
    }
    this.tail[0] = this.x;
    this.tail[0] = this.y;

    // set new head
    switch(this.direction) {
      case Direction.right:
        this.x++;
        break;
      case Direction.left:
        this.x--;
        break;
      case Direction.up:
        this.y--;
        break;
      case Direction.down:
        this.y++;
         break;
    }

    // wrap around
    if(this.x >= this.gridWidth) {
      this.x = 0;
    }
    else if(this.x < 0) {
      this.x = this.gridWidth-1;
    }

    if(this.y >= this.gridHeight) {
      this.y = 0;
    }
    else if(this.y < 0) {
      this.y = this.gridHeight-1;
    }
  }

  isTouching(x, y) {
    if (this.x === x && this.y === y) {
      return true;
    }
    for (let index = 0; index < this.tail.length; index++) {
      if (this.tail[index].x === x && this.tail[index].y === y) {
        return true;
      }
    }
    return false;
  }

  isHeadTouching(x, y) {
    return (this.x === x && this.y === y);
  }

  checkTouches() {
    for (let snakeIndex = 0; snakeIndex < this.game.snakes.length; snakeIndex++) {
      const other = this.games.snakes[snakeIndex];
      // check head to head collision
      if (other !== this) {
        if(other.x === this.x && other.y === this.y) {
          this.kill();
          other.kill();
        }
      }
      // did another snake or this snake touch this snake?
      for (let segmentIndex = 0; segmentIndex < this.snake.tail.length; segmentIndex++) {
        const segment = this.tail[segmentIndex];
        if (other.isHeadTouching(segment.x, segment.y)) {
          this.kill();
        }
      }
    }
    for (let snackIndex = 0; snackIndex < this.game.snacks.length; snackIndex++) {
      const snack = this.games.snack[snackIndex];
      if (snack.x === this.x && snack.y === this.y) {
        this.tail.push({x: this.x, y: this.y});
      }
    }
  }

}


class SnakeServer {

  constructor(nameManager, configuration) {
    this.nameManager = nameManager;
    this.configure(configuration);

    this.players = new Map();
    this.games = new Map();
  }

  configure(configuration) {
    const {
      port = 8081,
      boardHeight = 36,
      boardWidth = 168,
    } = configuration;

    this.port = port;
    this.boardHeight = boardHeight;
    this.boardWidth = boardWidth;
  }

  start() {
    console.log(`starting snake scene server  @${new Date()} ...`);
    this.socket = SocketIo(this.port);
    
    this.socket.on(this.onConnection.bind(this));
    console.log(`started snake scene server  @${new Date()} ...`);
  }

  registerPlayer(playerId, name) {
    let senderOkay = this.nameManager.isNameValid(name);
    if (!senderOkay) {
      //let responseMessage = "We do not recognize that name - try a common first name.";
      //return this.fillResponse(request, response, "Error", responseMessage);
  }
  this.players.set(playerId, name);
  }

  addPlayerToNextAvailableGame(player) {
    let resultGame = null;
    for (let gameIndex = 0; gameIndex < this.games.size; gameIndex++) {
      const game = this.games.get(gameIndex);
      if (!game.started() && !game.full()) {
        resultGame = game;
        break;
      }
    }
    if (resultGame === null) {
      resultGame = new Game();
      this.games.push(resultGame);
    }
    resultGame.appPlayer(player);
    return resultGame;
  }

  deletePlayer(playerId) {
    this.players.delete(playerId);
  }

  onConnection(socket) {
    console.log("Client connected: " + socket.id);

    socket.on("disconnect", function(socket) {
      console.log("Client disconnected: " + socket.id);
      this.deletePlayer(socket.id);
    }.bind(this));

    // Socket.io events
    socket.on("registration", function(name) {
      this.nameManager.checkName(name);
      const player = { id:socket.id, name:name, socket:socket };
      this.players.set(player.id, player);
      socket.emit("registrationComplete", player);
    }.bind(this));

    socket.on("ready", function(player) {
      const game = this.getNextGameForPlayer(player.id);
      socket.emit("playerAddedtoGame", player.playerId, game.id);
    }.bind(this));

    // keypress - player presses a key
    socket.on("keypress", function(key) {
      const game = this.getCurrentGame();
      if (game) {
        game.onKeyPress(socket.id, key);
      }
    }.bind(this));

    // player disconnected
    socket.on("disconnect", function() {
      const playerId = socket.id;
      const game = this.getCurrentGame();
      if (!game) {
        game.onPlayerDisconnect(playerId);
      }
      this.deletePlayer(playerId);

    }.bind(this));
  }

}


//////////////////////////////////////////////////////////////////////////////

class SnakesScene {

  constructor(gridzilla, onPaused, nameManager, configuration) {
    this.gridzilla = gridzilla;
    this.onPaused = onPaused;
    this.nameManager = nameManager;

    this.configure(configuration);
  
    this.server = new SnakeServer(this);
    this.server.start();
    console.log(`loading cheer complete  @${new Date()}`);

    this.paused = true;
  }

  configure(configuration) {
    const {
      gamePeriod = 10000,
      scenePeriod = 60000,
    } = configuration;

    //gamePeriod is a maximum, some cheers are shorter, but never longer
    this.gamePeriod = gamePeriod;
    this.scenePeriod = scenePeriod;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Scene control 
  //////////////////////////////////////////////////////////////////////////////
  
  run() {
    console.log("SnakesScene run");
    this.paused = false;
    this.startTime = Date.now();
    this.startGame();
  }

  pause() {
    console.log("SnakeScene pause");
    clearTimeout(this.runningTimer);
    if (this.snakeServer) {
      this.snakeserver.stopCurentGame();
    }
    this.paused = true;
    this.onPaused();
  }

  forcePause() {
    console.log("SnakeScene forcePause");
    this.pause();
  }

  //////////////////////////////////////////////////////////////////////////////

  fillResponse(request, response, status, message) {
    return response.json({
      sessionId: request.body.sessionId,
      status: status,
      message: message,
      source: 'SnakesScene'
    });
  }

}

module.exports = SnakesScene;
