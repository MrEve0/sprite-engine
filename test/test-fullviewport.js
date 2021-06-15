const   canvas = document.getElementById('canvas'),
        tiles = document.createElement ( 'canvas' ),
        gl = canvas.getContext ( 'webgl2' ),
        tctx = tiles.getContext ( '2d' )
        tex = gl.createTexture ()
        fs = require ( 'fs' );

function drawStuff() {
        // do your drawing stuff here
}

function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        /**
         * Your drawings need to be inside this function otherwise they will be reset when
         * you resize the browser window and the canvas goes will be cleared.
         */
        drawStuff();
}

require.extensions['.glsl'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);
resizeCanvas();

tiles.width = 208;
tiles.height = 16;
tctx.font = "monospace 16px";
tctx.textBaseLine = "top";
tctx.fillStyle = 'black';

for ( let i = 0; i < 26; i += 1 ) {
    tctx.fillText ( String.fromCharCode ( 65 + i ), i * 8, 16 );
}

gl.pixelStorei ( gl.UNPACK_FLIP_Y_WEBGL, true );
gl.bindTexture ( gl.TEXTURE_2D, tex );
gl.texImage2D ( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tiles );
gl.bindTexture ( gl.TEXTURE_2D, null );
