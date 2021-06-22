let icons = "˃🖿🗋🗎🖽🎝📽👁🗑🗕🗖🗙";

const   fs = require ( 'fs' ),
        path = require ( 'path' ),
        guids = new Set (),
        fileViewTemplate = document.createElement ( 'template' ),
        fileFolderTemplate = document.createElement ( 'template' ),
        fileNodeTemplate = document.createElement ( 'template' );

require.extensions['.html'] = function ( module, filename ) {
    module.exports = fs.readFileSync ( filename, 'utf8' ).replace ( /\n\s*/g, '' );
};

fileViewTemplate.innerHTML = require ( '../html/file-view.html' );
fileFolderTemplate.innerHTML = require ( '../html/file-folder.html' );
fileNodeTemplate.innerHTML = require ( '../html/file-node.html' );

function guid () {
    let store = new Uint32Array ( 1 ),
        uuid;
    do {
        uuid = [].map.call ( crypto.getRandomValues ( store ), v => v.toString ( 16 ) ).join ( '' ).padStart ( 8, 0 );
    } while ( document.getElementById ( uuid ) );
    guids.add ( uuid );
    return uuid;
}

class FileView extends HTMLElement {

    #shadow = null;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( fileViewTemplate.content.cloneNode ( true ) );

        this.addEventListener ( 'dragover', event => {
            if ( guids.has ( event.dataTransfer.getData ( 'text/plain' ) ) ) {
                event.preventDefault ();
                event.dataTransfer.dropEffect = 'move';
            }
        } );

        this.addEventListener ( 'drop', event => {
            if ( guids.has ( event.dataTransfer.getData ( 'text/plain' ) ) ) {
                event.preventDefault ();
                this.appendChild ( document.getElementById ( event.dataTransfer.getData ( "text/plain" ) ) );
            }
        } );
    }
}

class FileFolder extends HTMLElement {

    #shadow = null;
    #name = null;
    #path = '';

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( fileFolderTemplate.content.cloneNode ( true ) );
        this.#name = this.#shadow.getElementById ( 'name' );

        this.addEventListener ( 'dragstart', event => {
            event.dataTransfer.setData ( "text/plain", event.target.id );
            event.dataTransfer.dropEffect = 'move';
        } );

        this.addEventListener ( 'dragover', event => {
            let id = event.dataTransfer.getData ( 'text/plain' );
            if ( guids.has ( id ) && id !== this.id ) {
                event.preventDefault ();
                event.dataTransfer.dropEffect = 'move';
            }
        } );

        this.addEventListener ( 'drop', event => {
            let id = event.dataTransfer.getData ( 'text/plain' );
            if ( guids.has ( id ) && id !== this.id ) {
                event.preventDefault ();
                this.appendChild ( document.getElementById ( event.dataTransfer.getData ( "text/plain" ) ) );
            }
        } );
    }

    get name () {
        return this.#name.textContent;
    }

    set name ( val ) {
        if ( this.#name.textContent !== val ) {
            let newPath = path.normalize ( path.join ( path.dirname ( this.path ), val ) );
            fs.rename ( this.path, newPath, err => {
                if ( err ) {
                    throw err;
                }
                this.path = newPath;
                this.#name.textContent = path.basename ( newPath );
            } );
        }
    }

    get path () {
        return this.getAttribute ( 'path' );
    }

    set path ( val ) {
        this.setAttribute ( 'path', path.normalize ( val ) );
    }

    connectedCallback () {
        let id = this.id;
        if ( !id ) {
            this.id = guid ();
        } else if ( !guids.has ( id ) ) {
            guids.add ( id );
        }
        this.draggable = true;

        if ( !this.hasAttribute ( 'path' ) ) {
            throw new ReferenceError ( '<file-folder> must have [path] attribute' );
        }

        this.#name.textContent = path.basename ( this.path );

        
    }

    disconnectedCallback () {
        let id = this.id;
        if ( guids.has ( id ) ) {
            guids.delete ( id );
        }
    }
}

class FileNode extends HTMLElement {

    #shadow = null;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( fileFolderTemplate.content.cloneNode ( true ) );

        this.addEventListener ( 'dragstart', event => {
            event.dataTransfer.setData ( "text/plain", event.target.id );
            event.dataTransfer.dropEffect = 'move';
        } );
    }

    connectedCallback () {
        let id = this.id;
        if ( !id ) {
            this.id = guid ();
        } else if ( !guids.has ( id ) ) {
            guids.add ( id );
        }
        this.draggable = true;
    }

    disconnectedCallback () {
        let id = this.id;
        if ( guids.has ( id ) ) {
            guids.delete ( id );
        }
    }
}
