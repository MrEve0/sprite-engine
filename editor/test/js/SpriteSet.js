const fsp = require ( 'fs/promises' );

/**
  * loads a Sprite Engine tile set of positioned 16x16 tiles.
  *
  * SpriteSet file format:
  * extension - .sps
  * signature - "SPRENGSET"
  * layout type - <byte> 0 (defualt) positioned, 1 fixed
  * position count - <int32>
  * packed position size - <int32>
  * tile count - <int32>
  * packed tile size <int32>
  * palette length - <uint8>
  * packed palette size - <int32>
  * packed position data - <unit8>
  * packed tile data - <uint8>
  * packed palette data - <uint8>
  */

class SpriteSet extends EventTarget {
    static POSITIONED = 0;
    static FIXED = 1;
    static TYPE = {
        0: 'POSITIONED',
        1: 'FIXED'
    };

    static fromBuffer ( buffer ) {
        let uint8 = new Uint8Array ( data.buffer ),
            position = 0,
            signature =  String.fromCharCodes ( ...uint8.slice ( 0, 9 ) );
        if ( singature === 'SPRENGSET' ) {
            position += signature.length;
            let view = new DataView ( data.buffer ),
                spriteSet = new SpriteSet (),
                layout = view.getUint8 ( position );
            if ( layout in SpriteSet.TYPE ) {
                spriteSet.type = SpriteSet.TYPE [ layout ];
            } else {
                throw new TypeError ( 'Unsupported layout type: ' + layout );
            }
        } else {
            throw new TypeError ( 'Invalid file signature: ' + signature );
        }
    }

    constructor ( src ) {
        super ();
        
        if ( typeof src === 'string' ) {
            fsp.readFile ( src ).then ( data => {
                Object.assign ( this, SpriteSet.fromBuffer ( data.buffer ) );
                this.dispatchEvent ( new Event ( 'load' ) )
            } );
        }

        this.type = '';
        this.width = 0;
        this.height = 0;
        this.positions = [];
        this.tiles = [];
        this.palette = [];
    }
}
