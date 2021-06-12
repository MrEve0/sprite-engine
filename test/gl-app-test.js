var canvas = document.getElementById('canvas'),
    gl = canvas.getContext("experimental-webgl"),
    fs = require('fs');

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
       // do your drawing stuff here
}

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

require.extensions['.glsl'] = function(module, filename){
    module.exports = fs.readFileSync(filename, 'utf8');
};

console.log(__dirname);

var vertexShader = require('./vertex.glsl'),
    fragmentShader = require('./fragment.glsl');

function createProgram(v, f){

    var program = gl.createProgram(),
        vert = gl.createShader(gl.VERTEX_SHADER),
        frag = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vert, vertexShader);
    gl.shaderSource(frag, fragmentShader);
    gl.compileShader(vert);
    gl.compileShader(frag);
    // Attach pre-existing shaders
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS) ) {
      var info = gl.getProgramInfoLog(program);
      throw 'Could not compile WebGL program. \n\n' + info;

    }
    return program;
}
var program = createProgram(gl, [vertexShader, fragmentShader]);
gl.useProgram(program);

// look up where the vertex data needs to go.
var positionLocation = gl.getAttribLocation(program, "a_position");

// set the resolution
var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

// setup a rectangle from 10,20 to 80,30 in pixels
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0,
    0, canvas.height,
    canvas.width, canvas.height,
    0, 0,
    canvas.width, canvas.height,
    canvas.width, 0]), gl.STATIC_DRAW);

// draw
gl.drawArrays(gl.TRIANGLES, 0, 6);
