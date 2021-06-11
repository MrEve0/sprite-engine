let canvas = document.getElementById ( 'canvas' ),
    ctx = canvas.getContext ( '2d' ),
    texture = document.createElement ( 'canvas' ),
    tctx = texture.getContext ( '2d' );

texture.width = 208;
texture.height = 16;
tctx.font = "monospace 16px";
tctx.textBaseLine = "top";
ctx.imageSmoothingEnabled = false;
ctx.fillStyle = 'black';

for ( let i = 0; i < 26; i = i + 1 ) {
    tctx.fillText ( String.fromCharCode ( 65 + i ), i * 8, 16 );
}

ctx.scale ( 4, 4 );

ctx.drawImage ( texture, 0, 0 );

console.log ( 'test' );
