const   fsp = require ( 'fs/promises' ),
        zlib = require ( 'zlib' );

/**
  * Loads a Sprite Engine tile set of 16x16 tiles.
  *
  * SpriteSet file format:
  * extension - .sps
  * signature - "SPRENGSET"
  * layout type - <byte> 0 (default) positioned, 1 fixed
  * width - <unint8> width in tiles
  * height - <unit8> height in tiles
  * position count - <uint16> number of tile positions ( unit8 [ x, y, index ] )
  * tile count - <unit8> number of unique tiles ( 16x16 RGBA )
  * palette length - <uint8> number of palette colors ( unit8 RGBA )
  * zlib/deflate chunk - <unit8> buffer of positions ( if layout type 0 ),
  *     tiles, palette colors
  */

module.exports = class SpriteSet extends EventTarget {
    static POSITIONED = 0;
    static FIXED = 1;
    static TYPE = {
        0: 'POSITIONED',
        1: 'FIXED'
    };
    static SIGNATURE_SIZE = 9;
    static SIGNATURE = 'SPRENGSET';
    static TILE_SIZE = 256;
    static COLOR_SIZE = 4;

    static fromBuffer ( buffer ) {
        let view = new DataView ( buffer ),
            position = 0,
            signature =  String.fromCharCodes ( ...new Uint8Array ( buffer.slice ( 0, SpriteSet.SIGNATURE_SIZE ) ) );
        if ( singature === SpriteSet.SIGNATURE ) {
            position += signature.length;
            let spriteSet = new SpriteSet (),
                layout = view.getUint8 ( position++ );
            if ( layout in SpriteSet.TYPE ) {
                spriteSet.type = SpriteSet.TYPE [ layout ];
            } else {
                throw new TypeError ( 'Unsupported layout type: ' + layout );
            }
        } else {
            throw new TypeError ( `SpriteSet: invalid file signature - "${signature}"` );
        }
    }

    #complete = false;

    constructor ( src ) {
        super ();

        if ( typeof src === 'string' ) {
            fsp.readFile ( src ).then ( data => {
                SpriteSet.fromBuffer ( data.buffer ).then ( spriteSet => {
                    Object.assign ( this, spriteSet );
                    this.dispatchEvent ( new Event ( 'load' ) );
                } );
            } );
        }

        this.type = '';
        this.width = 0;
        this.height = 0;
        this.positions = null;
        this.tiles = null;
        this.palette = null;

        this.addEventListener ( 'load', event => this.#complete = true );
    }
}
