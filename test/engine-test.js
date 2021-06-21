let SpriteEngine = require ( '../src/js/SpriteEngine.js' ),

    canvas = document.getElementById ( 'canvas' ),
    engine = new SpriteEngine ( canvas ),
    gl = engine.gl,
    attrs = {
        a_position : {
            data : null,
            size : 2,
            type : gl.FLOAT,
            normalize : false,
            stride : 0,
            offset : 0,
            location : NaN,
            buffer : null
        },
        a_texCoord : {
            data : [ 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0 ],
            size : 2,
            type : gl.FLOAT,
            normalize : false,
            stride : 0,
            offset : 0,
            location : NaN,
            buffer : null
        }
    },
    unifs = {
        u_resolution : {
            type : '2f',
            data : null,
            location : NaN
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

function getTileTexture () {

    let texture = document.createElement ( 'canvas' ),
        tctx = texture.getContext ( '2d' );

    texture.width = 416;
    texture.height = 16;
    tctx.font = '24px/1 monospace';
    tctx.textBaseLine = 'top';

    tctx.fillStyle = 'rgb(0,255,0)';
    tctx.fillRect ( 0, 0, texture.width, texture.height );

    tctx.fillStyle = 'black';

    for ( let i = 0; i < 26; i = i + 1 ) {
        tctx.fillText ( String.fromCharCode ( 65 + i ), 1 + i * 16, 15 );
    }

    return texture;
}

engine.initCanvas ();

let image = tex.image = getTileTexture ();

attrs.a_position.data = [ 0, 0, image.width, 0, 0, image.height, 0, image.height, image.width, 0, image.width, image.height ];

unifs.u_resolution.data = [ canvas.width, canvas.height ];

engine.loadProgram ();

engine.setAttributes ( attrs );

engine.setUniforms ( unifs );

engine.bufferTexture ( tex );

engine.draw ();
