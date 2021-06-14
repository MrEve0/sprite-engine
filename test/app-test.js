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
