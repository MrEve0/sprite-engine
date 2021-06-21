module.exports = class SpriteEngine {

    constructor ( canvas, outputSize = { width: 640, height: 360 } ) {
        this.gl = canvas.getContext ( 'webgl' );
        this.dimensions = outputSize;
        this.output = null;
        this.pixelSize = 1;
        this.resize = true;

        canvas.addEventListener ( 'resize', () => {
            this.resize = true;
        } );
    }

    // x, y is from bottom left corner
    setViewport () {
        if ( this.resize ) {
            let gl = this.gl, canvas = gl.canvas,
                width = canvas.width = canvas.clientWidth,
                height = canvas.height = canvas.clientHeight,
                dim = this.dimensions,
                pixelSize = this.pixelSize = Math.min ( Math.floor ( width / dim.width ), Math.floor ( height / dim.height ) ),
                viewportWidth = pixelSize * dim.width,
                viewportHeight = pixelSize * dim.height,
                x0 = Math.floor ( 0.5 * ( width - viewportWidth ) ),
                y0 = Math.floor ( 0.5 * ( height - viewportHeight ) ),
                x1 = x0 + viewportWidth,
                y1 = y0 + viewportHeight;

            this.output = [ x0, y0, x1, y0, y1, x0, y1, x0, x1, y0, x1, y1 ];

            // limits viewport to dim.width x dim.height scaled by pixelSize, and centered
            gl.viewport ( x, y, x + viewportWidth, y + viewportHeight );

            this.resize = false;
        }
    }

    initCanvas () {
        let gl = this.gl,
            canvas = gl.canvas;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport ( 0, 0, canvas.width, canvas.height );
        // Clear the canvas
        gl.clearColor ( 0, 0, 0, 0 );
        gl.clear ( gl.COLOR_BUFFER_BIT );
    }

    createShader ( type, source ) {
        var gl = this.gl, shader = gl.createShader ( type );
        gl.shaderSource ( shader, source );
        gl.compileShader ( shader );
        var success = gl.getShaderParameter ( shader, gl.COMPILE_STATUS );

        this[type = gl.FRAGMENT_SHADER? 'frag' : 'vert'] = shader;

        if ( success ) {
            return shader;
        }

        console.log ( gl.getShaderInfoLog ( shader ) );
        gl.deleteShader ( shader );
    }

    loadProgram ( vertText = document.getElementById ( 'vertex-shader-2d' ).text, fragText = document.getElementById ( 'fragment-shader-2d' ).text ) {
        var gl = this.gl,
            program = gl.createProgram (),
            vertexShader = this.createShader ( gl.VERTEX_SHADER, vertText ),
            fragmentShader = this.createShader ( gl.FRAGMENT_SHADER, fragText );

        gl.attachShader ( program, vertexShader );
        gl.attachShader ( program, fragmentShader );
        gl.linkProgram ( program );

        var success = gl.getProgramParameter ( program, gl.LINK_STATUS );
        if ( success ) {
            this.program = program;
            gl.useProgram ( program );
            return program;
        }

        console.error ( gl.getProgramInfoLog ( program ) );
        gl.deleteProgram ( program );
    }

    /* {
        target: gl.TEXTURE_2D,
        wrapS: gl...

    } */
    bufferTexture ( { target, wrapS, wrapT, minF, magF, fmt, type, image } ) {
        // Create a texture.
        let texture = gl.createTexture ();
        gl.bindTexture ( target, texture );

        // Set the parameters so we can render any size image.
        gl.texParameteri ( target, gl.TEXTURE_WRAP_S, wrapS );
        gl.texParameteri ( target, gl.TEXTURE_WRAP_T, wrapT );
        gl.texParameteri ( target, gl.TEXTURE_MIN_FILTER, minF );
        gl.texParameteri ( target, gl.TEXTURE_MAG_FILTER, magF );

        // Upload the image into the texture.
        gl.texImage2D ( target, 0, fmt, fmt, type, image );
    }

    /* object<attrs> {

    } */
    setAttributes ( attrs ) {
        let gl = this.gl;
        // [ [ ], [ attributeName, val ] ]
        for ( let [ name, val ] of Object.entries ( attrs ) ) {
            // get the binding point, create a buffer
            var location = attrs [ name ].location = gl.getAttribLocation ( this.program, name ),
                buffer = attrs [ name ].buffer = gl.createBuffer ();

            // enable the attirbute, bind the buffer, supply the data, convey the data format
            gl.enableVertexAttribArray ( location );
            gl.bindBuffer ( gl.ARRAY_BUFFER, buffer );
            gl.bufferData ( gl.ARRAY_BUFFER, new Float32Array ( val.data ), gl.STATIC_DRAW );
            gl.vertexAttribPointer ( location, val.size, val.type, val.normalize, val.stride, val.offset );
        }
    }

    setUniforms ( unifs ) {
        let gl = this.gl;
        for ( let [ name, val ] of Object.entries ( unifs ) ) {
            // lookup uniforms
            var location = unifs [ name ].location = gl.getUniformLocation ( this.program, name );

            // set the resolution
            gl [ 'uniform' + val.type ] ( location, ...val.data );
        }
    }

    enableAttributes ( attrs ) {
        let gl = this.gl;

        for ( let [ name, val ] of Object.entries ( attrs ) ) {
            // Turn on the position attribute
            gl.enableVertexAttribArray ( val.location );
            // Bind the position buffer.
            gl.bindBuffer ( gl.ARRAY_BUFFER, val.buffer );
            gl.vertexAttribPointer ( val.location, val.size, val.type, val.normalize, val.stride, val.offset );
        }
    }

    draw () {
        let gl = this.gl,
            primitiveType = gl.TRIANGLES,
            offset = 0,
            count = 6;

        gl.drawArrays ( primitiveType, offset, count );
    }

}
