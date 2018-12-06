// Snake socket API
"use strict";

const TimestampUtilities = require("./TimestampUtilities.js");

const BitmapBuffer = require("./BitmapBuffer.js");
const Jimp = require("jimp");

const Font = require("./Font.js");
const Color = require("./Color.js");

const { colorNameToRgb } = require("./config-colors.js");

// ----- constants -----

const snakeColors = [ "Red", "Green", "Yellow", "Blue", "Purple", "Orange" ];

const Direction = {
  Up: "Up",
  Down: "Down",
  Left: "Left",
  Right: "Right"
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
      gameTimeLimit = 20*1000,
      scaleFactor = 3,
      gridHeight = 12*3/scaleFactor,
      gridWidth = 14*12/scaleFactor,
      moveInterval = 250
    } = configuration;

    this.maxPlayers = maxPlayers;
    this.gameTimeLimit = gameTimeLimit;
    this.scaleFactor = scaleFactor;
    this.gridHeight = gridHeight,
    this.gridWidth = gridWidth;
    this.moveInterval = moveInterval;
  }

  deletePlayer(playerId) {
    // remove player from future games
    if (!this.isStarted()) {
      this.players.delete(playerId);
      this.snakes.delete(playerId);
    }
  }

  addPlayer(player) {
    if (this.snakes.size >= this.maxPlayers) {
      throw "To many players added to game";
    }
    this.players.set(player.id, player);
    const colorName = snakeColors[this.snakes.size];
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
      const snack = new Snack(this);
      snack.initialize();
      this.snacks.push(snack);
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
    // this.sendStatus();

    // draw game board on Gridzilla
    this.drawBoard();

    // is it time to stop the game?
    const nowTime = Date.now();
    if (nowTime > this.startTime + this.gameTimeLimit || this.getLiveSnakeCount() < 1) {
      this.stop();
      this.scene.pause();
      return;
    }
    
    this.timer = setTimeout(this.onTimer.bind(this), this.moveInterval); 
  }

  getLiveSnakeCount() {
    let count = 0;
    this.snakes.forEach( function(snake) { if (snake.isLive()) count++; }, this);
    return count;
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
        y: snake.y,
        tail: snake.tail
      });
    }
    const snacks = Array();
    this.snacks.forEach( function(snack) { 
      snacks.push({
        x: snack.x,
        y: snack.y
      });
     });


    const data = {snakes, snacks}

    this.io.emit("snakes.state", data);
    // console.log("snakes.state", data);
  }

  drawBoard() {
    // console.log("SnakesScene drawBoard");

    const frameBuffer = BitmapBuffer.fromNew(168, 36, new Color(0, 0, 0));

    for (let snake of this.snakes.values()) {
       const color = new Color(colorNameToRgb[snake.colorName]);

      frameBuffer.drawRect(snake.x*this.scaleFactor, snake.y*this.scaleFactor, this.scaleFactor, this.scaleFactor, color)
      if (snake.tail) {
        for (let tailIndex = 0; tailIndex < snake.tail.length; tailIndex++) {
          let tailPart = snake.tail[tailIndex];
          frameBuffer.drawRect(tailPart.x*this.scaleFactor, tailPart.y*this.scaleFactor, this.scaleFactor, this.scaleFactor, color)
        }
      }
    }

    const snackColor = new Color(colorNameToRgb["White"]);
    for (let snack of this.snacks) {
      frameBuffer.drawRect(snack.x*this.scaleFactor, snack.y*this.scaleFactor, this.scaleFactor, this.scaleFactor, snackColor);
    }

    this.scene.gridzilla.transformScreen(frameBuffer);
  }

  getSnake(playerId) {
    return this.snakes.get(playerId);
  }

  changeDirection(playerId, direction) {
    const snake = this.getSnake(playerId);
    if (snake) {
      snake.changeDirection(direction);
    }
  }

  reportResults() {
    const players = new Array();
    for (let snake of this.snakes.values()) {
      players.push({
        id : snake.playerId,
        name: this.players.get(snake.playerId).name,
        points: snake.tail.length+1
      });
    }
    
    const data = { gameId: this.id, players };
    this.io.emit("snakes.gameReport", data);
    // console.log("snakes.gameResults", data);
  }

  isEmpty(x, y) {
    this.snakes.forEach( function(snake) { if (snake.isTouching(x, y)) return false; } );
    this.snacks.forEach( function(snack) { if (snack.isTouching(x, y)) return false; } );
    return true;
  }

  onPlayerDisconnected(playerId) {
    const snake = this.getSnake(playerId);
    if (snake) {
      snake.kill();
    }
  }
}

//////////////////////////////////////////////////////////////////////////////

class Snake {

  constructor(game, playerId, colorName) {
    this.game = game;
    this.playerId = playerId;
    this.colorName = colorName;
    this.dead = false;
  }

  isLive() { return !this.dead; }
 
  initialize() {
    const maxTries = this.game.gridWidth * this.game.gridHeight;
    for (let tryIndex = 0; tryIndex < maxTries; tryIndex++) {
      const headX = Math.floor((Math.random() * (this.game.gridWidth - 3) + 1));
      const headY = Math.floor((Math.random() * (this.game.gridHeight - 3) + 1));

      if (this.game.isEmpty(headX, headY)) {
        switch (Math.floor((Math.random() * 5)))
        {
          case 1: this.direction = Direction.Left; break;
          case 2: this.direction = Direction.Up; break;
          case 3: this.direction = Direction.Down; break;
          default: this.direction = Direction.Right; break;
        }
        let x = headX;
        let y = headY;
        let foundOverlap = false;
        let tempTail = [];
        for (let tailIndex=0; tailIndex < 5 && !foundOverlap; tailIndex++) {
          switch (this.direction) {
            case Direction.Left:
              x++;
              if (x >= this.game.gridWidth) {
                x = 0;
              }
              break;
            case Direction.Right:
              x--;
              if(x < 0) {
                x = this.game.gridWidth-1;
              }
              break;
            case Direction.Up:
              y++;
              if (y >= this.game.gridHeight) {
                y = 0;
              }
                  break;
            case Direction.Down:
              y--;
              if(y < 0) {
                y = this.game.gridHeight-1;
              }
              break;
          }
          if (!this.game.isEmpty(x, y)) {
            foundOverlap = true;
            break;
          }
          tempTail[tailIndex] = { x, y};
        }
        if (!foundOverlap) {
          this.x = headX;
          this.y = headY;
          this.tail = tempTail;
          break;
        }
      }
    }
  }

  changeDirection(direction) {
    switch (direction) {
      case Direction.Up:
        if (this.direction !== Direction.Down) {
          this.direction = Direction.Up;
        }
        break;
      case Direction.Right:
        if (this.direction !== Direction.Left) {
          this.direction = Direction.Right;
        }
        break;
      case Direction.Down:
        if (this.direction !== Direction.Up) {
          this.direction = Direction.Down;
        }
        break;
      case Direction.Left:
        if (this.direction !== Direction.Right) {
          this.direction = Direction.Left;
        }
      break;
    }
  }

  move() {
    if (this.isLive()) {
      // remove the last tail segment
      for(let index = this.tail.length-1; index > 0; index--) {
        this.tail[index] = this.tail[index-1];
      }
      this.tail[0] = { x: this.x, y: this.y };

      // set new head
      switch(this.direction) {
        case Direction.Right:
          this.x++;
          if (this.x >= this.game.gridWidth) {
            this.x = 0;
          }
          break;
        case Direction.Left:
          this.x--;
          if(this.x < 0) {
            this.x = this.game.gridWidth-1;
          }
          break;
        case Direction.Down:
          this.y++;
          if (this.y >= this.game.gridHeight) {
            this.y = 0;
          }
              break;
        case Direction.Up:
          this.y--;
          if(this.y < 0) {
            this.y = this.game.gridHeight-1;
          }
          break;
      }
    }
  }

  isTouching(x, y) {
    if (!this.isLive()) return false;

    if (this.x === x && this.y === y) {
      return true;
    }
    if (this.tail) {
      for (let index = 0; index < this.tail.length; index++) {
        if (this.tail[index].x === x && this.tail[index].y === y) {
          return true;
        }
      }
    }
    return false;
  }

  isHeadTouching(x, y) {
    return (this.isLive() && this.x === x && this.y === y);
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
          break;
        }
      }
      // did another snake or this snake "bite" this snake?
      for (let segmentIndex = 0; segmentIndex < this.snake.tail.length; segmentIndex++) {
        const segment = this.tail[segmentIndex];
        if (other.isHeadTouching(segment.x, segment.y)) {
          this.kill();
          break;
        }
      }
    }
    for (let snackIndex = this.game.snacks.length-1; snackIndex >= 0; snackIndex--) {
      const snack = this.game.snacks[snackIndex];
      if (this.isHeadTouching(snack.x, snack.y)) {
        this.game.snacks.splice(snackIndex, 1);
        this.tail.push({x: this.x, y: this.y});
        break;
      }
    }
  }

  kill() {
    this.dead = true;
  }
}

//////////////////////////////////////////////////////////////////////////////

class Snack {

  constructor(game) {
    this.game = game;
  }
 
  initialize() {
    const maxTries = this.game.gridWidth * this.game.gridHeight;
    for (let tryIndex = 0; tryIndex < maxTries; tryIndex++) {
      const x = Math.floor((Math.random() * (this.game.gridWidth - 3) + 1));
      const y = Math.floor((Math.random() * (this.game.gridHeight - 3) + 1));

      if (this.game.isEmpty(x, y)) {
          this.x = x;
          this.y = y;
          break;
      }
    }
  }

  isTouching(x, y) {
    return (this.x === x && this.y === y);
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
      gameTimeLimit = 100*1000,
      scenePeriod = 120*1000,
    } = configuration;

    // gameTimeLimit is a maximum, some games are shorter, but never longer
    this.gameTimeLimit = gameTimeLimit;
    this.scenePeriod = scenePeriod;

  }

  addPlayerToNextAvailableGame(player) {
    let resultGame = null;
    for (let game of this.games.values()) {
      if (!game.isStarted() && !game.isFull()) {
        resultGame = game;
        break;
      }
    }
    if (resultGame === null) {
      resultGame = new Game(this, {gameTimeLimit: this.gameTimeLimit});
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
      } else {
        const player = { id:socket.id, name:data.name };
        this.players.set(player.id, player);
        const game = this.addPlayerToNextAvailableGame(player);
        const snake = game.getSnake(player.id);

        socket.emit("snakes.registered", {
          status: "Okay",
          gameId: game.id,
          colorName: snake.colorName });
      }
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

    socket.on("snakes.changeDirection", function(direction) {
      const game = this.currentGame;
      if (game) {
        game.changeDirection(socket.id, direction);
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
