// imports
const Express = require('express');
const BodyParser = require("body-parser");

const app = Express();

// contants
const port = process.env.PORT || 3001;

// start the server //http.Server
const server = app.listen(port, function () {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Facade emulator listening at http://' + host + ':' + port);
});

// accept JSON and URL encodded parameters
app.use(BodyParser.json({limit: '300kb', extended: true}));
app.use(BodyParser.urlencoded({extended: true}));


// setup routes
app.get("/", function (req, res) {
  res.sendFile(__dirname  + "/facadeEmulator.html");
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

app.get("/status", function (req, res) {
    res.status(200).send(Object.keys(socketIo.connected).length + " Client(s) connected!");
});

//http://localhost:3000/background/red
//http://localhost:3000/background/127
app.get("/background/:data", function (req, res) {
  let data = req.params.data;
  socketIo.emit("background", data);
  res.status(200).send(data);
});

//http://localhost:3000/pixel?x=1&y=1&r=255&g=255&b=0
app.get("/pixel", function (req, res) {
  let x = req.query.x;
  let y = req.query.y;
  let r = req.query.r;
  let g = req.query.g;
  let b = req.query.b;
  socketIo.emit("pixel", x, y, r, g, b);
  res.status(200).send(x + ", " + y + ", " + r + ", " + g + ", " + b);
});


app.post("/screen", function (req, res) {
  const data = req.body.data;
  socketIo.emit("screen", data);
  res.status(200).send(data);
});


// initialize sockets //SocketIO.Namespace
var socketIo = require('socket.io')(server).on('connection',
  function (socket) {
    
    console.log("Client connected: " + socket.id);
      
    socket.on('disconnect', function(socket) {
      console.log("Client disconnected: " + socket.id);
    });
  }
);

