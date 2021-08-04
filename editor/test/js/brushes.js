const   fsp = require ( 'fs/promises' ),
        zlib = require ( 'zlib' ),
        SpriteSet = require ( './SpriteSet' );

/**
  * A multi-layered Sprite Engine raw brush data object with no associated
  * Sprite Engine SpriteSet. Used by Sprite Engine SpriteBrushSet.
  */

class SpriteBrush {
    constructor ( width, height, layers, data ) {
        this.width = width;
        this.height = height;
        this.layers = [];
        if ( data ) {
            if ( data.buffer && data.buffer.constructor === ArrayBuffer ) {
                data = data.buffer;
            } else if ( Array.isArray ( data ) ) {
                data = new Uint8Array ( data ).buffer;
            } else if ( data.constructor !== ArrayBuffer ) {
                throw new TypeError ( 'SpriteBrush: unsupported data object - ' + Object.prototype.toString.call ( data ) );
            }
        } else {
            throw new TypeError ( 'SpriteBrush: invalid argument "data" - ' + Object.prototype.toString.call ( data ) );
        }

        let offset = 0, length = width * height;
        for ( let i = 0; i < layers; i = i + 1 ) {
            this.layers.push ( new Uint8Array ( data, offset, length ) );
            offset += length;
        }
    }

    set ( x, y, depth, data ) {
        if ( depth < this.layers.length )
            let offset;
            if ( data instanceof SpriteBrush ) {
                let layer, position, row, raw;
                for ( layer = 0; layer < data.layers.length; layer += 1 ) {
                    offset = y * this.width + x;
                    if ( layer + depth < this.layers.length ) {
                        for ( row = 0; row < data.height; row += 1 ) {
                            if ( row + y < this.height ) {
                                let raw = data.layers [ layer ].slice (
                                    row * data.width, Math.min ( row * ( 1 + data.width ), row * data.width + this.width - x )
                                );
                                this.layers [ layer + depth ].set ( raw, offset );
                                offset += this.width;
                            } else { break; }
                        }
                    } else { break; }
                }
            } else if ( 'number' === typeof data ) {
                this.layers [ depth ] [ offset ] = data;
            }
        }
    }
}

/**
  * A set of multi-layered Sprite Engine brushes associated with an included
  * Sprite Engine SpriteSet.
  *
  * When loaded from a file, if the `src` argument to the constructor is a
  * string referring to the path of a SpriteBrush file, a file name is included
  * in the file to refer to a Sprite Engine SpriteSet.  The SpriteSet file must
  * be in the same folder as the SpriteBrush file or no SpriteSet will be
  * loaded. Alternatively, a SpriteSet instance may be passed to the
  * constructor.
  *
  * SpriteBrush file format:
  * extension - .spb
  * signature - "SPRENGBRU"
  * brush count - <uint8> number of brushes
  * zlib/deflate chunk - <uint8> buffer of brushes:
  *     width - <uint8> width in tiles ( total width is brushWidth * tileWidth )
  *     height - <uint8> height in tiles ( total height is brushHeight * tileHeight )
  *     layers - <uint8> number of layers ( layer size is brushWidth * brushHeight ),
  * followed by a SpriteSet ( in the same deflated chunk )
  */

class SpriteBrushSet extends EventTarget {
    SIGNATURE_SIZE = 9;
    SIGNATURE = "SPRENGBST";

    static fromBuffer ( buffer ) {
        let view = new DataView ( buffer ),
            position = 0,
            signature =  String.fromCharCodes ( ...new Uint8Array ( buffer.slice ( 0, SpriteBrush.SIGNATURE_SIZE ) ) );
        if ( signature === SpriteBrush.SIGNATURE ) {
            position += SpriteBrush.SIGNATURE_SIZE;
            return new Promise ( ( resolve, reject ) => {
                let brushCount = view.getUint8 ( position++ ),
                    packed = buffer.slice ( position );
                zlib.deflateRaw ( packed, ( err, data ) => {
                    if ( err ) reject ( err );

                    let view = new DataView ( data.buffer ),
                        brushSet = new SpriteBrushSet ();
                        i, width, height, layers, position = 0;

                    brushSet.brushes = [];
                    for ( i = 0; i < brushCount; i += 1 ) {
                        width = view.getUint8 ( position++ );
                        height = view.getUint8 ( position++ );
                        layers = view.getUint8 ( position++ );
                        data = buffer.slice ( position, position += width * height * layers );
                        brushSet.brushes.push ( new SpriteBrush ( width, height, layers, data ) );
                    }
                    brushSet.spriteSet = new SpriteSet ( buffer.slice ( position ) );

                    brushSet.addEventListener ( 'load', event => brushSet.dispatchEvent ( new Event ( 'load' ) ) );

                    resolve ( brushSet );
                } );
            } );
        } else {
            throw new TypeError ( `SpriteBrushSet: invalid file signature - "${signature}"` );
        }
    }

    #complete = false;

    constructor ( src ) {
        if ( typeof src === 'string' ) {
            fsp.readFile ( src ).then ( data => {
                SpriteBrush.fromBuffer ( data.buffer ).then ( spriteBrush => {
                    Object.assign ( this, spriteBrush );
                    this.dispatchEvent ( new Event ( 'load' ) );
                } );
            } );
        }

        this.brushes = null;
        this.spriteSet = null;

        this.addEventListener ( 'load', event => this.#complete = true );
    }

    get complete () {
        return this.#complete;
    }
}

module.exports.SpriteBrush = SpriteBrush;
module.exports.SpriteBrushSet = SpriteBrushSet;
