const assert = require('assert');
const Color = require("../Color.js");


describe('Color tests', function () {
    before(function () {
    });

    it('toInt tests', function () {
        let white = new Color(255, 255, 255);
        let black = new Color(0, 0, 0);
        let other = new Color(1, 0, 255, 127);

        assert.equal(white.toInt(), 0xFFFFFFFF);
        assert.equal(black.toInt(), 0x000000FF);
        assert.equal(other.toInt(), 0x0100FF7F);
    });

});
