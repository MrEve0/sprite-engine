var canvas = document.getElementById('canvas'),
    gl = canvas.getContext("webgl"),
    fs = require('fs'), // look up where the vertex data needs to go.
    positionLocation,
    // set the resolution
    resolutionLocation,
    buffer = gl.createBuffer(),
    program;

require.extensions['.glsl'] = function(module, filename){
    module.exports = fs.readFileSync(filename, 'utf8').replace ( /^\s*|\s*$/, '' );
};

function createProgram ( vText, fText ) {

    var program = gl.createProgram (),
        vert = gl.createShader ( gl.VERTEX_SHADER ),
        frag = gl.createShader ( gl.FRAGMENT_SHADER ),
        compiled;

    gl.shaderSource ( vert, vText );
    gl.compileShader ( vert );
    compiled = gl.getShaderParameter ( vert, gl.COMPILE_STATUS );
    if (!compiled) {
        // Something went wrong during compilation; get the error
        console.error ( gl.getShaderInfoLog ( vert ) );
    }

    gl.shaderSource ( frag, fText );
    gl.compileShader ( frag );
    compiled = gl.getShaderParameter ( frag, gl.COMPILE_STATUS );
    if (!compiled) {
        // Something went wrong during compilation; get the error
        console.error ( gl.getShaderInfoLog ( frag ) );
    }

    // Attach pre-existing shaders
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS) ) {
      var info = gl.getProgramInfoLog(program);
      throw 'Could not compile WebGL program. \n\n' + info;

    }
    gl.useProgram(program);
    positionLocation = gl.getAttribLocation(program, "a_position");
    resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    return program;
}

function resizeCanvas() {
   canvas.width = window.innerWidth;
   canvas.height = window.innerHeight;

   /**
    * Your drawings need to be inside this function otherwise they will be reset when
    * you resize the browser window and the canvas goes will be cleared.
    */
   render();
}
resizeCanvas();

function render() {

    if (!program){
        var vert = require('./vertex.glsl'),
            frag = require('./fragment.glsl');

        console.log ( vert, '\n', frag );
        program = createProgram(gl, vert, frag );
    }
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // setup a rectangle from 10,20 to 80,30 in pixels
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        0, canvas.height,
        canvas.width, canvas.height,
        0, 0,
        canvas.width, canvas.height,
        canvas.width, 0]), gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

console.log(__dirname);
