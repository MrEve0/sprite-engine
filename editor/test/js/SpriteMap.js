const   fsp = require ( 'fs/promises' ),
        zlib = require ( 'zlib' );

/**
  * Loads a Sprite Engine area map consisting of one or more map layers built
  * from a set of tiles.
  *
  * SpriteMap file format:
  * extension - .spm
  * signature - "SPRENGMAP"
  * width - <int32> width in tiles ( total width is mapWidth * tileWidth )
  * height - <int32> height in tiles ( total height is mapHeight * tileHeight )
  * layers - <unit8> number of layers ( layer size is mapWidth * mapHeight )
  * tile count - <unit8> number of tiles ( 16x16 indexed )
  * palette length - <uint8> number of palette colors ( uint8 RGBA )
  * packed data - <uint8> buffer of layers, tiles, palette colors
  */

    module.exports = class SpriteMap extends EventTarget {
        static SIGNATURE_SIZE = 9;
        static SIGNATURE = 'SPRENGMAP';
        static TILE_SIZE = 256;
        static COLOR_SIZE = 4;

        static fromBuffer ( buffer ) {
            let view = new DataView ( buffer ),
             position = 0,
             signature =  String.fromCharCodes ( ...new Uint8Array ( buffer.slice ( 0, SpriteSet.SIGNATURE_SIZE ) ) );
            if ( singature === SpriteMap.SIGNATURE ) {
                position += signature.length;
                return new Promise ( ( resolve, reject ) => {
                    let mapWidth = view.getInt32 ( ( position += 4 ) - 4 ),
                        mapHeight = view.getInt32 ( ( position += 4 ) - 4 ),
                        layersCount = view.getUint8 ( position++ ),
                        tileCount = view.getUint8 ( position++ ),
                        paletteLen = view.getUint8 ( position++ ),
                        packed = buffer.slice ( position );

                    zlib.deflateRaw ( packed, ( err, data ) => {
                        if ( err ) reject ( err );

                        let spriteMap = new SpriteMap (),
                            i, position = 0;
                            spriteMap.width = width;
                            spriteMap.height = height;
                            spriteMap.layers = [];
                        for ( i = 0; i < layersCount; i += 1 ) {
                            spriteMap.layers.push (
                                new Uint8Array (
                                    data.buffer.slice ( position, ( position += ( i + 1 ) * mapWidth * mapHeight ) )
                                )
                            );
                        }
                        spriteMap.tiles = [];
                        for ( i = 0; i < tileCount; i += 1 ) {
                            spriteMap.tiles.push (
                                new Uint8Array (
                                    data.buffer.slice ( position, ( position += ( i + 1 ) * SpriteMap.TILE_SIZE ) )
                                )
                            );
                        }
                        spriteMap.palette = [];
                        for ( i = 0; i < paletteLen; i += 1 ) {
                            spriteMap.palette.push (
                                new Uint8Array (
                                    data.buffer.slice ( position, ( position += ( i + 1 ) * SpriteMap.COLOR_SIZE ) )
                                )
                            );
                        }

                        spriteMap.dispatchEvent ( new Event ( 'load' ) );

                        resolve ( spriteMap );
                    } );
                } )
            } else {
                throw new TypeError ( `SpriteMap: invalid file signature - "${signature}"` );
            }
        }

        #complete = false;

        constructor ( src ) {
            super ();

            if ( typeof src === 'string' ) {
                fsp.readFile ( src ).then ( data => {
                    SpriteMap.fromBuffer ( data.buffer ).then ( spriteMap => {
                        Object.assign ( this, spriteMap );
                        this.dispatchEvent ( new Event ( 'load' ) );
                    } );
                } );
            }

            this.width = 0;
            this.height = 0;
            this.layers = null;
            this.tiles = null;
            this.palette = null;

            this.addEventListener ( 'load', event => this.#complete = true );
        }

        get complete () {
            return this.#complete;
        }

        get ( x, y, width = 1, height = 1, depth = 1 ) {

        }
 }
