// imports
const Express = require('express');
const BodyParser = require("body-parser");

const app = Express();
const SocketIo = require('socket.io');

// contants
const port = process.env.PORT || 3000;

// start the server //http.Server
const server = app.listen(port, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Display emulator listening at http://' + host + ':' + port);
});

// accept JSON and URL encodded parameters
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended: true}));


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


//ex: http://localhost:3000/echoQuery/4
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


//ex: http://localhost:3000/echoQuery?input=4
app.get("/echoQuery", function (req, res) {
  var input = req.query.input;

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




// initialize sockets //SocketIO.Server
SocketIo(server).on('connection',
  function (socket) {
  
    console.log("Client connected: " + socket.id);
      
    socket.on('disconnect', function(socket) {
      console.log("Client disconnected" + socket.id);
    });
  }
);

