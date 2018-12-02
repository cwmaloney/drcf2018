// Snake socket API
"use strict";

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

//////////////////////////////////////////////////////////////////////////////

let nextGameId = 1;

class Game {

  constructor(server, configuration) {
    this.server = server;
    this.gameId = nextGameId++;
    
    this.configure(configuration);

    this.players = new Map();
  }

  configure(configuration) {
    const {
      maxPlayers = 4,
      gameTimeLimit = 50000,
      boardHeight = 36,
      boardWidth = 168,
      moveInterval = 1000
    } = configuration;

    this.maxPlayers = maxPlayers;
    this.gameTimeLimit = gameTimeLimit;
    this.boardHeight = boardHeight,
    this.boardWidth = boardWidth;
    this.moveInterval = moveInterval;
  }

  deletePlayer(playerId) {
    // remove player from future games
    if (!this.started && !this.ended) {
      this.players.delete(playerId);
    }
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
    
    this.startTime = TimestampUtilities.getNowTimestampNumber();

    this.timer = setTimeout(this.onTimer.bind(this), this.moveInterval);
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

    // is it time to stop the game?
    const nowTime = Date.now();
    if (nowTime > this.startTime + this.gameTimeLimit) {
      this.stop();
      this.pause();
      return;
    }
    
    this.timer = setTimeout(this.onTimer.bind(this), this.moveInterval); 
  }

  sendStatus() {
    this.server.socket.emit("state", {
      snakes: this.snakes.map((snake) => ({
        id : snake.player.id,
        color : snake.player.color,
        colorRgb: colorNameToRgb[snake.player.color],
        x: snake.x,
        y: snake.y ,
        tail: snake.tail
      })),
      snacks: this.snacks
    });
  }

  getSnake(playerId) {
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

  reportResults() {

  }

  stop() {
    this.running = true;
    this.stopTime = TimestampUtilities.getNowTimestampNumber();

    this.reportResults();
  }
}

//////////////////////////////////////////////////////////////////////////////

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
    for (let snackIndex = 0; snackIndex < this.game.snacks.length; snackIndex++) {
      const snack = this.games.snack[snackIndex];
      if (snack.x === this.x && snack.y === this.y) {
        this.tail.push({x: this.x, y: this.y});
      }
    }
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
    this.games = new Map();
    this.paused = true;
  }

  configure(configuration) {
    const {
      gameTimeLimit = 50000,
      scenePeriod = 60000,
      boardHeight = 36,
      boardWidth = 168,
    } = configuration;

    // gameTimeLimit is a maximum, some games are shorter, but never longer
    this.gameTimeLimit = gameTimeLimit;
    this.scenePeriod = scenePeriod;
    this.boardHeight = boardHeight;
    this.boardWidth = boardWidth;
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
        if (!game.started && !game.ended) {
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
        nextGame.start();
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
      this.nameManager.isNameValid(data.name);
      const player = { id:socket.id, name:data.name };
      this.players.set(player.id, player);
      socket.emit("snakes.registered", player);
    }.bind(this));

    socket.on("snakes.ping", function() {
      const game = this.currentGame;
      const currentGameId = (game) ? game.id : undefined;
      socket.emit("snakes.pingResponse", { currentGameId } );
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
      this.currentGame.onPlayerDisconnect(playerId);
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
      this.currentGame = null;
      this.currentGame.stop();
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
