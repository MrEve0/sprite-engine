let SpriteEngine = require ( '../src/js/SpriteEngine.js' ),
    canvas = document.getElementById ( 'canvas' ),
    engine = new SpriteEngine ( canvas ),
    attrs = {
        a_position : {
            data : [ -1, -1, -1, 1, 1, -1, -1, 1, 1, 1, 1, -1 ],
            size : 2,
            type : engine.gl.FLOAT,
            normalize : false,
            stride : 0,
            offset : 0
        }
    };

engine.loadProgram ();

engine.setAttributes ( attrs );

engine.useProgram ();

engine.enableAttributes ( attrs );

//engine.setUniforms ();

engine.initCanvas ();

engine.draw ();
