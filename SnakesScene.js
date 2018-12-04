// Snake socket API
"use strict";

const TimestampUtilities = require("./TimestampUtilities.js");

const BitmapBuffer = require("./BitmapBuffer.js");
const Jimp = require("jimp");

const Font = require("./Font.js");
const Color = require("./Color.js");

const { colorNameToRgb } = require("./config-colors.js");

// ----- constants -----

const snakeColors = [ "Red", "Blue", "Green", "Yellow", "Purple", "Orange" ];

// // key codes
// const KeyCodes = {
//   left: 37,
//   up: 38,
//   right: 39,
//   down: 40
// };

const Direction = {
  up: "up",
  down: "down",
  left: "left",
  right: "right"
};

//////////////////////////////////////////////////////////////////////////////

let nextGameId = 1;

class Game {

  constructor(scene, configuration) {
    this.scene = scene;
    this.id = nextGameId++;
    
    this.configure(configuration);

    this.players = new Map();
    this.snakes = new Map();
    this.snacks = new Array();
  }

  configure(configuration) {
    const {
      maxPlayers = 4,
      gameTimeLimit = 50000,
      gridHeight = 36,
      gridWidth = 168,
      moveInterval = 1000
    } = configuration;

    this.maxPlayers = maxPlayers;
    this.gameTimeLimit = gameTimeLimit;
    this.gridHeight = gridHeight,
    this.gridWidth = gridWidth;
    this.moveInterval = moveInterval;
  }

  deletePlayer(playerId) {
    // remove player from future games
    if (!this.isStarted()) {
      this.palyers.delete(playerId);
      this.snakes.delete(playerId);
    }
  }

  addPlayer(player) {
    if (this.snakes.size >= this.maxPlayers) {
      throw "To many players added to game";
    }
    this.players.set(player.id, player);
    const colorName = snakeColors[this.players.size];
    const snake = new Snake(this, player.id, colorName);
    this.snakes.set(player.id, snake);
    return snake;
  }

  isFull() {
    return (this.snakes.size >= this.maxPlayers);
  }

  addSnacks() {
    const wanted = Math.max(3, this.players.size);
    const toAdd = wanted - this.snacks.length;
    for (let index = 0; index < toAdd; index++) {
      const x = Math.floor((Math.random() * (this.gridWidth - 3) + 1));
      const y = Math.floor((Math.random() * (this.gridHeight - 3) + 1));
      if (this.isEmpty(x, y)) {
        this.snacks.push({x, y});
      }
    }
  }

  initializeSnakes() {
    this.snakes.forEach( function(snake) { snake.initialize(); }, this);
  }

  sendMessage() {
    // to do
  }

  start(io) {
    this.io = io;

    this.initializeSnakes();
    this.addSnacks();
    
    this.startTime = Date.now();
    this.startTimestampNumber = TimestampUtilities.getNowTimestampNumber();
    this.active = true;

    this.timer = setTimeout(this.onTimer.bind(this), this.moveInterval);
    this.io.emit("snakes.gameStarted", { id: this.id });
  }

  isStarted() {
    return this.startTime !== undefined;
  }

  isEnded() {
    return this.endTime !== undefined;
  }

  stop() {
    if (!this.stopTime) {
      this.io.emit("snakes.gameEnded", { id: this.id });

      this.stopTime = Date.now();
      this.stopTimestampNumber = TimestampUtilities.getNowTimestampNumber();
      this.active = false;
 
      this.reportResults();
      this.io = null;
    }
  }

  onTimer() {
    // move snakes
    this.snakes.forEach( function(snake) { snake.move(); } );

    // check for touches
    this.snakes.forEach( function(snake) { snake.checkTouches(); } );

    this.addSnacks();

    // send status to all players
    this.sendStatus();

    // is it time to stop the game?
    const nowTime = Date.now();
    if (nowTime > this.startTime + this.gameTimeLimit) {
      this.stop();
      this.scene.pause();
      return;
    }
    
    this.timer = setTimeout(this.onTimer.bind(this), this.moveInterval); 
  }

  sendStatus() {
    const snakes = new Array();
    for (let [playerId, snake] of this.snakes) {
      snakes.push({
        id : playerId,
        dead: snake.dead,
        colorName: snake.colorName,
        colorRgb: colorNameToRgb[snake.colorName],
        x: snake.x,
        y: snake.y ,
        tail: snake.tail
      });
    }
    const data = {snakes, snacks: this.snacks}

    this.io.emit("snakes.state", data);
    console.log("snakes.state", data);
  }

  getSnake(playerId) {
    return this.snakes.get(playerId);
  }

  onKeyPress(message) {
    const snake = this.findSnake(message.playerId);
    if (snake) {
      snake.onKeyPress(message);
    }
  }

  reportResults() {
    // to do
  }

  isEmpty(x, y) {
    // to do
    return true;
  }

  onPlayerDisconnected(playerId) {
    const snake = this.getSnake(playerId);
    if (snake) {
      snake.dead = true;
    }
  }
}

//////////////////////////////////////////////////////////////////////////////

class Snake {

  constructor(game, playerId, colorName) {
    this.game = game;
    this.playerId = playerId;
    this.colorName = colorName;
    // this.dead = false;
  }
 
  initialize() {
    const maxTries = this.game.gridWidth * this.game.gridHeight;
    for (let tryIndex = 0; tryIndex < maxTries; tryIndex++) {
      const headX = Math.floor((Math.random() * (this.game.gridWidth - 3) + 1));
      const headY = Math.floor((Math.random() * (this.game.gridHeight - 3) + 1));
      if (this.game.isEmpty(headX, headY)) {
        const tailY = headY;
        let tailX;
        if (headX < this.gridWidth/2) {
          tailX = headX - 1;
          this.direction = Direction.right;
        } else {
          tailX = headX + 1;
          this.direction = Direction.left;
        }
        if (this.game.isEmpty(tailX, tailY)) {
          this.x = headX;
          this.y = headY;
          this.tail = [];
          this.tail[0] = { x: tailX, y: tailY };
          break;
        }
      }
    }
  }

  onKeyPress(key) {
    switch (key) {
      case KeyCodes.Up:
        if (this.direction !== Direction.Down) {
          this.direction = Direction.Up;
        }
        break;
      case KeyCodes.Right:
        if (this.direction !== Direction.Left) {
          this.direction = Direction.Right;
        }
        break;
      case KeyCodes.Down:
        if (this.direction !== Direction.Up) {
          this.direction = Direction.Down;
        }
        break;
      case KeyCodes.Left:
        if (this.direction !== Direction.Right) {
          this.direction = Direction.Left;
        }
      break;
    }
  }

  move() {
    if (!this.dead) {
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
  }

  isTouching(x, y) {
    if (this.dead) return false;

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
    if (this.dead) return false;

    return (this.x === x && this.y === y);
  }

  checkTouches() {
    let snakes = this.game.snakes;
    for (let snakeIndex = 0; snakeIndex < snakes.length; snakeIndex++) {
      const other = snakes[snakeIndex];
      // is this a head to head collision?
      if (other !== this) {
        if(other.x === this.x && other.y === this.y) {
          this.kill();
          other.kill();
        }
      }
      // did another snake or this snake "bite" this snake?
      for (let segmentIndex = 0; segmentIndex < this.snake.tail.length; segmentIndex++) {
        const segment = this.tail[segmentIndex];
        if (other.isHeadTouching(segment.x, segment.y)) {
          this.kill();
        }
      }
    }
    const snacks = this.game.snacks;
    for (let snackIndex = 0; snackIndex < snacks.length; snackIndex++) {
      const snack = snacks[snackIndex];
      if (snack.x === this.x && snack.y === this.y) {
        this.tail.push({x: this.x, y: this.y});
      }
    }
  }

  kill() {
    this.dead = true;
  }

}

//////////////////////////////////////////////////////////////////////////////

class SnakesScene {

  constructor(gridzilla, onPaused, nameManager, io, configuration) {
    this.gridzilla = gridzilla;
    this.onPaused = onPaused;
    this.nameManager = nameManager;
    this.io = io;

    this.configure(configuration);

    this.players = new Map();
    this.games = new Array();

    this.paused = true;
  }

  configure(configuration) {
    const {
      gameTimeLimit = 50000,
      scenePeriod = 60000,
      gridHeight = 36,
      gridWidth = 168,
    } = configuration;

    // gameTimeLimit is a maximum, some games are shorter, but never longer
    this.gameTimeLimit = gameTimeLimit;
    this.scenePeriod = scenePeriod;
    this.gridHeight = gridHeight;
    this.gridWidth = gridWidth;
  }

  addPlayerToNextAvailableGame(player) {
    let resultGame = null;
    for (let gameIndex = 0; gameIndex < this.games.size; gameIndex++) {
      const game = this.games.get(gameIndex);
      if (!game.isStarted() && !game.isFull()) {
        resultGame = game;
        break;
      }
    }
    if (resultGame === null) {
      resultGame = new Game(this, {});
      this.games.push(resultGame);
    }
    resultGame.addPlayer(player);
    return resultGame;
  }

  deletePlayer(playerId) {
    console.log("Snakes deletePlayer: " + playerId);
    this.players.delete(playerId);

    for (let gameIndex = 0; gameIndex < this.games.length; gameIndex++) {
      const game = this.games[gameIndex];
      game.deletePlayer(playerId);
    }
}

  getNextGame() {
    if (this.games) {
      for (let gameIndex = 0; gameIndex < this.games.length; gameIndex++) {
        const game = this.games[gameIndex];
        if (!game.isStarted()) {
          return game;
        }
      }
    }
  }

  startGame() {
    if (this.games) {
      const nextGame = this.getNextGame();
      if (nextGame) {
        this.currentGame = nextGame;
        nextGame.start(this.io);
      } else {
        this.pause();
      }
    } else {
      this.pause();
    }
  }

  onUserConnected(socket) {
    console.log("Snakes onUserConnected: " + socket.id);

    // Socket.io events
    socket.on("snakes.register", function(data) {
      if (!this.nameManager.isNameValid(data.name)) {
        socket.emit("snakes.registered",{
          status: "Error",
          message: "We do not recognize the name - try a common first name." });
      }

      const player = { id:socket.id, name:data.name };
      this.players.set(player.id, player);
      const game = this.addPlayerToNextAvailableGame(player);
      const snake = game.getSnake(player.id);

      socket.emit("snakes.registered", {
        status: "Okay",
        gameId: game.id,
        snakeColor: snake.color });
    }.bind(this));

    socket.on("snakes.ping", function() {
      const game = this.currentGame;
      const activeGameId = (game) ? game.id : undefined;
      socket.emit("snakes.pingResponse", { activeGameId } );
    }.bind(this));

    // socket.on("snakes.ready", function(player) {
    //   const game = this.getNextGameForPlayer(player.id);
    //   socket.emit("playerAddedtoGame", player.playerId, game.id);
    // }.bind(this));

    // keypress - player presses a key
    socket.on("snakes.keypress", function(key) {
      const game = this.getCurrentGame();
      if (game) {
        game.onKeyPress(socket.id, key);
      }
    }.bind(this));

  }

  onUserDisconnected(socket) {
    console.log("Snakes onUserDisconnected: " + socket.id);

    const playerId = socket.id;
    if (this.currentGame) {
      this.currentGame.onPlayerDisconnected(playerId);
    }

    this.deletePlayer(playerId);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Scene control 
  //////////////////////////////////////////////////////////////////////////////
  
  run() {
    console.log(`SnakesScene run  @${new Date()}`);
    this.paused = false;
    this.startTime = Date.now();
    this.startGame();
  }

  pause() {
    console.log(`SnakeScene pause  @${new Date()}`);
    clearTimeout(this.runningTimer);
    this.stopCurrentGame();
    this.paused = true;
    this.onPaused();
  }

  forcePause() {
    console.log(`SnakeScene forcePause  @${new Date()}`);
    this.pause();
  }

  stopCurrentGame() {
    if (this.currentGame) {
      this.currentGame.stop();
      this.currentGame = null;
    }
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
