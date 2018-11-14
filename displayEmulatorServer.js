// imports
const Express = require('express');
const BodyParser = require("body-parser");

const app = Express();
const SocketIo = require('socket.io');

// contants
const port = process.env.PORT || 3000;

// accept JSON and URL encodded parameters
server.use(BodyParser.json());
server.use(BodyParser.urlencoded({extended: true}));


// setup routes

app.get("/", function (req, res) {
  res.status(200).send({ message: 'Display Emulator is listening' });
});

app.get("/random", function (req, res) {
  const data = {
    value: Math.floor(Math.random() * 10)
  };
  res.status(200).send(data);
});

app.get("/echo/:input", function (req, res) {
  var input = req.params.input;

  if (isFinite(input) && input  > 0 ) {
    const data = {
      value: input
    };
  res.status(200).send(data);
  } else {
   res.status(400).send({ message: 'invalid number supplied' });
  }
});

app.get("/screen", function (req, res) {
  const data = req.params.data;
  SocketIo.emit("screen", data);
  res.status(200).send(data);
});

// start the server
const server = app.listen(port, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Display emulator listening at http://' + host + ':' + port);
});


// initialize sockets
SocketIo(server);

SocketIo.sockets.on('connection',
  function (socket) {
  
    console.log("Client connected: " + socket.id);
      
    socket.on('disconnect', function(socket) {
      console.log("Client disconnected" + socket.id);
    });
  }
);

