module.exports = class SpriteEngine {

    static VERTEX_SHADER = `// an attribute will receive data from a buffer
    attribute vec4 a_position;

    // all shaders have a main function
    void main() {
        // gl_Position is a special variable a vertex shader
        // is responsible for setting
        gl_Position = a_position;
    }`;

    static FRAGMENT_SHADER = `// fragment shaders don't have a default precision so we need
    // to pick one. mediump is a good default
    precision mediump float;

    void main() {
        // gl_FragColor is a special variable a fragment shader
        // is responsible for setting
        gl_FragColor = vec4(0, 1, 0, 1);
    }`;

    constructor ( canvas ) {
        this.gl = canvas.getContext ( 'webgl' );
        this.canvas = canvas;
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

        console.log ( vertText, '\n', fragText );

        gl.attachShader ( program, vertexShader );
        gl.attachShader ( program, fragmentShader );
        gl.linkProgram ( program );

        var success = gl.getProgramParameter ( program, gl.LINK_STATUS );
        if ( success ) {
            this.program = program;
            this.gl.useProgram ( this.program );
            return program;
        }

        console.error ( gl.getProgramInfoLog ( program ) );
        gl.deleteProgram ( program );
    }

    /* {
        target: gl.TEXTURE_2D,
        wrapS: gl...

    } */
    bufferTexture ( { target, wrapS, wrapT, minF, magF, fmt, type, canvas } ) {
        // Create a texture.
        var texture = gl.createTexture ();
        gl.bindTexture ( target, texture );

        // Set the parameters so we can render any size image.
        gl.texParameteri ( target, gl.TEXTURE_WRAP_S, wrapS );
        gl.texParameteri ( target, gl.TEXTURE_WRAP_T, wrapT );
        gl.texParameteri ( target, gl.TEXTURE_MIN_FILTER, minF );
        gl.texParameteri ( target, gl.TEXTURE_MAG_FILTER, magF );

        // Upload the image into the texture.
        gl.texImage2D ( target, 0, fmt, fmt, type, canvas );
    }

    /* object<attrs> {

    } */
    setAttributes ( attrs ) {
        let gl = this.gl;
        // [ [ ], [ attributeName, val ] ]
        for ( let [ name, val ] of Object.entries ( attrs ) ) {
            // look up where the vertex data needs to go.
            console.log ( this.program );

            var location = gl.getAttribLocation ( this.program, name ),
                buffer = attrs [ name ].buffer = gl.createBuffer ();

            // Turn on the position attribute
            gl.enableVertexAttribArray ( location );
            // Bind the position buffer.
            gl.bindBuffer ( gl.ARRAY_BUFFER, buffer );
            gl.bufferData ( gl.ARRAY_BUFFER, new Float32Array ( val.data ), gl.STATIC_DRAW );
            gl.vertexAttribPointer ( val.location, val.size, val.type, val.normalize, val.stride, val.offset );

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

    initCanvas () {
        let gl = this.gl;

        gl.viewport ( 0, 0, this.canvas.width, this.canvas.height );
        // Clear the canvas
        gl.clearColor ( 0, 0, 0, 0 );
        gl.clear ( gl.COLOR_BUFFER_BIT );
    }

    draw () {
        let gl = this.gl,
            primitiveType = gl.TRIANGLES,
            offset = 0,
            count = 6;

        gl.drawArrays ( primitiveType, offset, count );
    }

}
