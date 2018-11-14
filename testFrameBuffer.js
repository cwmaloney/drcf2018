const Color = require("./Color.js");
const FrameBuffer = require("./FrameBuffer.js");
const { GridzillaTransform } = require("./GridzillaTransform.js");

const frameBuffer = new FrameBuffer(168, 36);
//frameBuffer.drawLine(0, 0, 35, 35, new Color(200, 0, 0));
//frameBuffer.drawCircle(65, 18, 16, new Color(0, 0, 100));

for (let i = 0; i < 16; i+=2){
  var color;
  switch (i%5) {
    case 0:
      color = new Color(255, 0, 0);
      break;
    case 1:
      color = new Color(0, 255, 0);
      break
    case 2:
      color = new Color(0, 0, 255);
      break
    case 3:
      color = new Color(0, 0, 0);
      break
    case 4:
      color = new Color(255, 255, 255);
      break
  }
  frameBuffer.drawRect(i, i, 168 - 2 * i, 36 - 2 * i, color);
}
//frameBuffer.drawRect(0, 0, 168, 36, new Color(255, 0, 0));
//frameBuffer.fillRect(2, 2, 164, 32, new Color(0, 255, 0));
var transform = new GridzillaTransform();
transform.transformScreen(frameBuffer);


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
