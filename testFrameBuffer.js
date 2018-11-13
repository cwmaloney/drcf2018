const Color = require("./Color.js");
const FrameBuffer = require("./FrameBuffer.js");

const frameBuffer = new FrameBuffer(10, 10);
frameBuffer.drawLine(0, 0, 4, 9, new Color(200, 0, 0));
frameBuffer.drawCircle(6, 5, 3, new Color(0, 0, 100));

function toHex(d) {
  return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
}

for (var y = frameBuffer.height-1; y >= 0; y--) {
  var row = "";
  for (var x = 0; x < frameBuffer.width; x++) {
    const color = frameBuffer.getPixel(x,y);
    row += toHex(color.r) + " " + toHex(color.g) + " " + toHex(color.b) + "  "
  }
  console.log(row);
}
