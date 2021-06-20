let SpriteEngine = require ( '../src/js/SpriteEngine.js' ),


canvas = document.getElementById ( 'canvas' ),
engine = new SpriteEngine ( canvas ),
gl = engine.gl,
attrs = {
    a_position : {
        data : [ 0, 0, canvas.width, 0, canvas.height, 0, canvas.height, canvas.width, 0, canvas.width, canvas.height ],
        size : 2,
        type : engine.gl.FLOAT,
        normalize : false,
        stride : 0,
        offset : 0,
        buffer : null
    },
    a_texCoord : {
        data : [ 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, ],
        size : 2,
        type : engine.gl.FLOAT,
        normalize : false,
        stride : 0,
        offset : 0,
        buffer : null
    }
},
unifs = {
    u_resolution : {
        type : '2f',
        data : [ canvas.width, canvas.height ]
    }
},
tex = {
    target : gl.TEXTURE_2D,
    wrapS : gl.CLAMP_TO_EDGE,
    wrapT : gl.CLAMP_TO_EDGE,
    minF : gl.NEAREST,
    magF : gl.NEAREST,
    fmt : gl.RGBA,
    type : gl.UNSIGNED_BYTE,
    image : null
};

function loadImage () {
    let image = new Image ();
    image.onload = function () {
        tex.image = image;
        engine.bufferTexture ( tex );
        engine.initCanvas ();
        engine.draw ();
    }
    image.src = 'https://webglfundamentals.org/webgl/resources/leaves.jpg';
}

engine.loadProgram ();

engine.setAttributes ( attrs );

engine.setUniforms ( unifs );

loadImage ();
