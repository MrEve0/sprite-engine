"use strict";

function main() {
    let texture = document.createElement ( 'canvas' ),
        tctx = texture.getContext ( '2d' );

    texture.width = 208;
    texture.height = 16;
    tctx.font = "monospace 16px";
    tctx.textBaseLine = "top";
    tctx.fillStyle = "black";

    for ( let i = 0; i < 26; i = i + 1 ) {
        tctx.fillText ( String.fromCharCode ( 65 + i ), i * 8, 16 );
    }

    render ( texture );
}

function createShader ( gl, type, source ) {
    var shader = gl.createShader ( type );
    gl.shaderSource ( shader, source );
    gl.compileShader ( shader );
    var success = gl.getShaderParameter ( shader, gl.COMPILE_STATUS );

    if ( success ) {
        return shader;
    }

    console.log ( gl.getShaderInfoLog ( shader ) );
    gl.deleteShader ( shader );
}

function loadProgram ( gl, vertText = document.getElementById ( 'vertex-shader-2d' ).text, fragText = document.getElementById ( 'fragment-shader-2d' ).text ) {
    var program = gl.createProgram (),
        vertexShader = createShader ( gl, gl.VERTEX_SHADER, vertText ),
        fragmentShader = createShader ( gl, gl.FRAGMENT_SHADER, fragText );

    gl.attachShader ( program, vertexShader );
    gl.attachShader ( program, fragmentShader );
    gl.linkProgram ( program );

    var success = gl.getProgramParameter ( program, gl.LINK_STATUS );
    if ( success ) {
        return program;
    }

    console.error ( gl.getProgramInfoLog ( program ) );
    gl.deleteProgram ( program );
}

function initCanvas ( gl, canvas ) {
    gl.viewport ( 0, 0, canvas.width, canvas.height );
    // Clear the canvas
    gl.clearColor ( 0, 0, 0, 0 );
    gl.clear ( gl.COLOR_BUFFER_BIT );
}

function loadTexture ( gl, image ) {
    // Create a texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

<<<<<<< HEAD
function setRectangle ( gl, x, y, width, height ) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData ( gl.ARRAY_BUFFER, new Float32Array ( [
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ] ), gl.STATIC_DRAW );
}

=======
>>>>>>> upstream/main
function render ( image ) {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // setup GLSL program
  var program = loadProgram ( gl );

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

  // Create a buffer to put three 2d clip space points in
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Set a rectangle the same size as the image.
  setRectangle(gl, 0, 0, image.width, image.height);

  // provide texture coordinates for the rectangle.
  var texcoordBuffer = gl.createBuffer();
<<<<<<< HEAD
  gl.bindBuffer ( gl.ARRAY_BUFFER, texcoordBuffer );
  gl.bufferData ( gl.ARRAY_BUFFER, new Float32Array ( [
=======
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array ( [
>>>>>>> upstream/main
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0,
<<<<<<< HEAD
  ] ), gl.STATIC_DRAW );
=======
  ]), gl.STATIC_DRAW);
>>>>>>> upstream/main

  loadTexture ( gl, image );

  // lookup uniforms
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

  initCanvas ( gl, canvas );

  // Tell it to use our program (pair of shaders)
<<<<<<< HEAD
  gl.useProgram ( program );

  // Turn on the position attribute
  gl.enableVertexAttribArray ( positionLocation );

  // Bind the position buffer.
  gl.bindBuffer ( gl.ARRAY_BUFFER, positionBuffer );
=======
  gl.useProgram(program);

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
>>>>>>> upstream/main

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionLocation, size, type, normalize, stride, offset);

  // Turn on the texcoord attribute
<<<<<<< HEAD
  gl.enableVertexAttribArray ( texcoordLocation );
=======
  gl.enableVertexAttribArray(texcoordLocation);
>>>>>>> upstream/main

  // bind the texcoord buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
<<<<<<< HEAD
  gl.vertexAttribPointer (
      texcoordLocation, size, type, normalize, stride, offset );

  // set the resolution
  gl.uniform2f ( resolutionLocation, gl.canvas.width, gl.canvas.height );
=======
  gl.vertexAttribPointer(
      texcoordLocation, size, type, normalize, stride, offset);

  // set the resolution
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
>>>>>>> upstream/main

  // Draw the rectangle.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
<<<<<<< HEAD
  gl.drawArrays ( primitiveType, offset, count );
=======
  gl.drawArrays(primitiveType, offset, count);
}

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
>>>>>>> upstream/main
}

main();
