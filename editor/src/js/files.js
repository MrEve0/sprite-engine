let icon_glyphs = "˃🖿🗋🗎🖽🎝📽👁🗑🗕🗖🗙";

const   fs = require ( 'fs' ),
        path = require ( 'path' ),
        guids = new Set (),
        mime = require ( 'mime-types' ),
        trash = require ( 'trash' ),
        fileViewTemplate = document.createElement ( 'template' ),
        fileFolderTemplate = document.createElement ( 'template' ),
        fileNodeTemplate = document.createElement ( 'template' ),
        fileOptionsMenuTemplate = document.createElement ( 'template' ),
        fileOptions = null,
        icons = {
            audio: '🎝',
            application: '🗎',
            image: '🖽',
            other: '🗋',
            text: '🗋',
            video: '📽'
        },
        autoIndex = ( parent, name ) => {
            let ext = path.extname ( name ),
                dirname = path.dirname ( name ),
                basename = path.basename ( name ),
                root = basename.slice ( 0, basename.lastIndexOf ( ext ) ),
                sibling = null,
                indexed = root.match ( /\((\d+)\)$/ ),
                index = indexed ? Number ( index [ 1 ] ) + 1 : 1;

            while ( sibling = parent.querySelector ( `:scope > [name^=${root}]` ) ) {
                if ( indexed ) {
                    root = root.replace ( /\(\d+\)$/, `(${index})` );
                } else {
                    root += `(${index})`;
                }
            }

            return path.join ( dirname, root + ext );
        };

if ( !require.extensions [ '.html' ] ) {
    require.extensions [ '.html' ] = function ( module, filename ) {
        module.exports = fs.readFileSync ( filename, 'utf8' ).replace ( /\n\s*/g, '' );
    };
}

fileViewTemplate.innerHTML = require ( '../src/html/file-view.html' ).replace ( /\n\s*/g, '' );
fileFolderTemplate.innerHTML = require ( '../src/html/file-folder.html' ).replace ( /\n\s*/g, '' );
fileNodeTemplate.innerHTML = require ( '../src/html/file-node.html' ).replace ( /\n\s*/g, '' );
fileOptionsMenuTemplate.innerHTML = require ( '../src/html/file-options.html' ).replace ( /\n\s*/g, '' );

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
    #slot = null;
    #menu = null;
    #selected = null;
    #clickHandler = null;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( fileViewTemplate.content.cloneNode ( true ) );
        this.#slot = this.#shadow.getElementById ( 'slot' );
        this.#menu = this.#shadow.getElementById ( 'menu' );
        this.#selected = new Set ();
        this.#clickHandler = event => {
            if ( !this.contains ( event.target ) ) {
                this.#selected.forEach ( el => el.classList.remove ( 'selected' ) );
                this.#selected.clear ();
            }
        }

        this.addEventListener ( 'file-option', event => {
            let options = this.#userInteractions,
                interaction;
            if ( event.detail in options ) {
                interaction = options [ event.detail ];
                for ( let el of this.#selected ) {
                    interaction ( el, event );
                }
                this.#menu.hide ();
            }
        } );

        this.addEventListener ( 'pointerup', event => {
            if ( event.button === 2 ) {
                event.preventDefault ();
                let rect = this.getBoundingClientRect ();
                this.#menu.style.top = ( event.clientY - rect.top ) + 'px';
                this.#menu.style.left = ( event.clientX - rect.left ) + 'px';
                this.#menu.show ();
            }
        } );

        this.addEventListener ( 'click', event => {
            const selectSiblingsFrom = ( first, last ) => {
                console.log ( 'selecting siblings...' );
                while ( first ) {
                    console.log ( first.name );
                    this.#selected.add ( first );
                    first.classList.add ( 'selected' );
                    if ( first.tagName === 'FILE-FOLDER' ) {
                        if ( first.firstElementChild ) {
                            console.log ( 'selecting children...' );
                            selectSiblingsFrom ( first.firstElementChild, first.lastElementChild );
                        }
                    }
                    if ( first === last ) {
                        break;
                    }
                    first = first.nextSibling;
                }
            }

            if ( event.target !== this ) {
                if ( event.shiftKey ) {
                    let sel = [ ...this.#selected ], first, last, position;
                    if ( sel.length ) {
                        sel = sel [ sel.length - 1 ];

                        if ( event.target.parentElement === sel.parentElement ) {
                            // https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
                            position = event.target.compareDocumentPosition ( sel );
                            // DOCUMENT_POSITION_PRECEDING : 2
                            if ( position === 2 ) {
                                first = sel;
                                last = event.target;
                            // DOCUMENT_POSITION_FOLLOWING : 4
                            } else if ( position === 4 ) {
                                first = event.target;
                                last = sel;
                            }

                            console.log ( first.name, '\n', last.name );

                            selectSiblingsFrom ( first, last );
                        }
                    } else {
                        this.#selected.forEach ( el => el.classList.remove ( 'selected' ) );
                        this.#selected.clear ();
                        this.#selected.add ( event.target );
                        event.target.classList.add ( 'selected' );
                    }
                } else if ( event.ctrlKey ) {
                    if ( this.#selected.has ( event.target ) ) {
                        this.#selected.delete ( event.target );
                        event.target.classList.remove ( 'selected' );
                    } else {
                        this.#selected.add ( event.target );
                        event.target.classList.add ( 'selected' );
                    }
                } else {
                    this.#selected.forEach ( el => el.classList.remove ( 'selected' ) );
                    this.#selected.clear ();
                    this.#selected.add ( event.target );
                    event.target.classList.add ( 'selected' );
                }
            }
        } );

        this.addEventListener ( 'dragover', event => {
            if ( guids.has ( event.dataTransfer.getData ( 'text' ) ) ) {
                event.preventDefault ();
                event.dataTransfer.dropEffect = 'move';
            }
        } );

        this.addEventListener ( 'drop', event => {
            if ( guids.has ( event.dataTransfer.getData ( 'text' ) ) ) {
                event.preventDefault ();
                this.append ( document.getElementById ( event.dataTransfer.getData ( "text/plain" ) ) );
            }
        } );

        const   reorder = () => {
                    let children = this.#slot.assignedElements ().sort ( ( a, b ) => {
                        if ( a.tagName === b.tagName ) {
                            let a_name = path.basename ( a.name || '' ),
                                b_name = path.basename ( b.name || '' ),
                                a_ext = path.extname ( a_name ),
                                b_ext = path.extname ( b_name );
                            if ( a_ext === b_ext ) {
                                if ( a_name === b_name ) {
                                    throw new ReferenceError ( `cannot have two files/folders of the same name "${a_name}"` );
                                }
                                return a_name < b_name ? -1 : 1;
                            } else {
                                return a_ext < b_ext ? -1 : 1;
                            }
                        } else {
                            return a.tagName < b.tagName ? -1 : 1;
                        }
                    } );
                    this.append ( ...children.map ( child => { child.path = this.path; return child; } ) );
                    setTimeout ( bind, 0 );
                },
                onslotchange = event => {
                    this.#slot.removeEventListener ( 'slotchange', onslotchange );
                    setTimeout ( reorder, 0 );
                },
                bind = () => {
                    this.#slot.addEventListener ( 'slotchange', onslotchange );
                };

        bind ();

        this.addEventListener ( 'rename', event => {
            let oldPath = path.join ( event.target.path, event.detail.oldName ),
                newPath = path.join ( event.target.path, event.detail.newName );

            fs.rename ( oldPath, newPath, err => {

                if ( err ) {
                    throw err;
                }

                onslotchange ( event );
            } );
        } );

        this.addEventListener ( 'move', event => {
            let src = path.join ( event.detail.oldPath, event.target.name ),
                dest = path.join ( event.detail.oldPath, event.detail.newPath, event.target.name );

            fs.copyFile ( src, dest, err => {

                if ( err ) {
                    throw err;
                }

                event.target.parentElement.removeChild ( event.target );
                if ( event.detail.newPath === this.path ) {
                    this.append ( event.target );
                } else {
                    let placement = this.querySelector ( `[path=${event.detail.newPath}]` );
                    if ( placement ) {
                        if ( placement.tagName !== 'FILE-FOLDER' ) {
                            placement = placement.parentElement;
                        }
                        placement.append ( event.target );
                    }
                }
            } );
        } );
    }

    get #userInteractions() {
        return {
            'new-file': target => {
                if ( target === this || this.contains ( target ) ) {
                    target = target.tagName === 'FILE-NODE' ? target.parentElement : target;
                    let filePath = path.join ( target.path, target.name ),
                        fileName = 'new file',
                        fullPath = autoIndex ( target, path.join ( filePath, fileName ) );
                    fs.writeFile ( fullPath, '', 'utf8', err => {

                        if ( err ) {
                            throw err;
                        }

                        let file = document.createElement ( 'file-node' ),
                            placement = target.querySelector ( 'file-folder:last-of-type' );
                        file.name = fileName;
                        file.path = filePath;
                        if ( !placement ) {
                            target.prepend ( file );
                        } else {
                            target.insertBefore ( file, placement.nextSibling );
                        }

                        setTimeout ( () => {
                            file.editName ();
                        }, 0 );
                    } );
                }
            },
            'new-folder': target => {
                if ( target === this || this.contains ( target ) ) {
                    target = target.tagName === 'FILE-NODE' ? target.parentElement : target;
                    let folderPath = path.join ( target.path, target.name ),
                        folderName = 'new folder',
                        fullPath = autoIndex ( path.join ( folderPath, folderName ) );

                    fs.mkdir ( fullPath, err => {

                        if ( err ) {
                            throw err;
                        }

                        let folder = document.createElement ( 'file-folder' );
                        folder.name = folderName;
                        folder.path = folderPath;
                        target.prepend ( folder );
                        setTimeout ( () => {
                            folder.editName ();
                        }, 0 );
                    } );
                }
            },
            'rename': target => {
                if ( this.contains ( target ) ) {
                    target.editName ();
                }
            },
            'duplicate': target => {
                if ( this.contains ( target ) ) {
                    let path = target.path,
                        name = target.name,
                        src = path.join ( path, name ),
                        dest = autoIndex ( target.parentElement, src );
                    fs.copyFile ( src, dest, err => {

                        if ( err ) {
                            throw err;
                        }

                        let dup = target.cloneNode ( true );
                        dup.name = name;
                        dup.path = path;
                        target.parentElement.insertBefore ( dup, target.nextSibling );
                        setTimeout ( () => {
                            dup.editName ();
                        }, 0 );
                    } );
                }
            },
            'delete': target => {
                if ( this.contains ( target ) ) {
                    trash ( path.join ( target.path, target.name ), { glob: false } ).then ( () => {
                        target.parentElement.removeChild ( target );
                    } );
                    // fs.rm ( path.join ( target.path, target.name ), err => {
                    //
                    //     if ( err ) {
                    //         throw err;
                    //     }
                    //
                    //     target.parentElement.removeChild ( target );
                    // } );
                }
            },
            'copy': target => {
                if ( this.contains ( target ) ) {
                    if ( target.tagName === "FILE-NODE" ) {
                        fs.readFile ( path.join ( target.path, target.name ), ( err, data ) => {
                            if ( err ) {
                                throw err;
                            }

                            Object.entries ( {
                                'text/plain': target.id,
                                'text/html': target.outerHTML,
                                [ mime.lookup ( target.name ) ]: data.buffer
                            } ).forEach ( ( [ key, val ] ) => {
                                navigator.clipboard.write ( [ new ClipboardItem ( {
                                    [ key ]: new Blob ( [ val ], { type: key } )
                                } ) ] );
                            } );
                        } );
                    } else {
                        let key = 'text/html';
                        navigator.clipboard.write ( [ new ClipboardItem ( {
                            [ key ]: new Blob ( [ target.outerHTML ], { type: key } )
                        } ) ] );
                    }
                }
            },
            'cut': target => {
                this.#userInteractions.copy ( target );
                this.#userInteractions.delete ( target );
            },
            'paste': target => {
                const updatePath = ( parent, path ) => {
                        for ( let child of parent.children ) {
                            child.path = path.join ( path, child.path );
                            if ( child.tagName === "FILE-FOLDER" ) {
                                updatePath ( child, child.path );
                            }
                        }
                    };

                if ( target === this || this.contains ( target ) ) {
                    target = target.tagName === 'FILE-NODE' ? target.parentElement : target;
                    navigator.clipboard.read ().then ( data => {
                        for ( let item of data ) {
                            if ( item.types.includes ( 'text/plain' ) ) {
                                item.getType ( 'text/plain' ).then ( blob => {
                                    blob.text ().then ( id => {
                                        let el = document.getElementById ( id );
                                        if ( el ) {
                                            updatePath ( el, el.path );
                                            el.path = path.join ( target.path, el.path );
                                            target.append ( el );
                                        }
                                    } );
                                } );
                            } else if ( item.types.includes ( 'text/html' ) ) {
                                item.getType ( 'text/html' ).then ( blob => {
                                    blob.text ().then ( html => {
                                        let temp = document.createElement ( 'template' );
                                        temp.innerHTML = html;
                                        updatePath ( temp.content, target.path );
                                        target.append ( temp.content );
                                    } );
                                } );
                            }
                        }
                    } );
                }
            },
            'copy-full-path': target => {
                if ( this.contains ( target ) ) {
                    let type = 'text/plain';

                    navigator.clipboard.write ( [ new ClipboardItem ( {
                        [ type ]: new Blob ( [ path.join ( target.path, target.name ) ], { type } )
                    } ) ] );
                }
            }
        }
    }

    get path () {
        return this.getAttribute ( 'path' );
    }

    set path ( val ) {
        this.setAttribute ( 'path', path.normalize ( val || '' ) );
    }

    static get observedAttributes () { return [ 'path' ]; }

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( name === 'path' ) {
            newVal = path.normalize ( newVal || '' );
            if ( newVal !== path.normalize ( oldVal || '' ) ) {
                this.dispatchEvent ( new CustomEvent ( 'source-change', { detail: { oldPath: oldVal, newPath: newVal } } ) );
            }
        }
    }

    connectedCallback () {
        window.addEventListener ( 'click', this.#clickHandler );
    }

    disconnectedCallback () {
        window.removeEventListener ( 'click', this.#clickHandler );
    }

    autoPopulate () {
        let dir = this.path;

        const populate = ( parent, dir ) => {
            fs.readdir ( dir, ( err, files ) => {

                if ( err ) {
                    throw err;
                }

                files.forEach ( file => {
                    let fullPath = path.join ( dir, file ),
                        child = null;
                    if ( fs.lstatSync ( fullPath ).isDirectory () ) {
                        child = document.createElement ( 'file-folder' );
                        child.path = path.dirname ( fullPath );
                        child.name = path.basename ( fullPath );
                        populate ( child, fullPath );
                    } else {
                        child = document.createElement ( 'file-node' );
                        child.path = path.dirname ( fullPath );
                        child.name = path.basename ( fullPath );
                    }
                    parent.append ( child );
                } );
            } );
        }

        populate ( this, dir );
    }
}

class FileFolder extends HTMLElement {

    #shadow = null;
    #wrapper = null;
    #name = null;
    #content = null;
    #slot = null;
    #updating = false;
    #expanded = false;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( fileFolderTemplate.content.cloneNode ( true ) );
        this.#wrapper = this.#shadow.getElementById ( 'wrapper' );
        this.#name = this.#shadow.getElementById ( 'name' );
        this.#content = this.#shadow.getElementById ( 'content' );
        this.#slot = this.#shadow.getElementById ( 'slot' );

        this.addEventListener ( 'click', event => {
            if ( event.target === this ) {
                if ( !( event.shiftKey || event.ctrlKey ) ) {
                    this.expanded = !this.expanded;
                }
            }
        } );

        this.addEventListener ( 'dragstart', event => {
            event.dataTransfer.setData ( 'text', event.target.id );
            event.dataTransfer.dropEffect = 'move';
        } );

        this.addEventListener ( 'dragover', event => {
            let id = event.dataTransfer.getData ( 'text' );
            if ( guids.has ( id ) && id !== this.id ) {
                event.preventDefault ();
                event.dataTransfer.dropEffect = 'move';
            }
        } );

        this.addEventListener ( 'drop', event => {
            let id = event.dataTransfer.getData ( 'text' );
            if ( guids.has ( id ) && id !== this.id ) {
                event.preventDefault ();
                this.append ( document.getElementById ( event.dataTransfer.getData ( 'text' ) ) );
            }
        } );

        const   reorder = () => {
                    let children = this.#slot.assignedElements ().sort ( ( a, b ) => {
                        if ( a.tagName === b.tagName ) {
                            let a_name = path.basename ( a.name || '' ),
                                b_name = path.basename ( b.name || '' ),
                                a_ext = path.extname ( a_name ),
                                b_ext = path.extname ( b_name );
                            if ( a_ext === b_ext ) {
                                if ( a_name === b_name ) {
                                    throw new ReferenceError ( `cannot have two files/folders of the same name "${a_name}"` );
                                }
                                return a_name < b_name ? -1 : 1;
                            } else {
                                return a_ext < b_ext ? -1 : 1;
                            }
                        } else {
                            return a.tagName < b.tagName ? -1 : 1;
                        }
                    } );
                    this.append ( ...children );
                    setTimeout ( bind, 0 );
                },
                onslotchange = event => {
                    this.#slot.removeEventListener ( 'slotchange', onslotchange );
                    setTimeout ( reorder, 0 );
                },
                bind = () => {
                    this.#slot.addEventListener ( 'slotchange', onslotchange );
                };

        bind ();
    }

    get name () {
        return this.getAttribute ( 'name' );
    }

    set name ( val ) {
        this.setAttribute ( 'name', path.basename ( val || '' ) );
    }

    get path () {
        return this.getAttribute ( 'path' );
    }

    set path ( val ) {
        if ( path.basename ( val || '' ) === this.name ) {
            val = path.dirname ( val || '' );
        }
        this.setAttribute ( 'path', path.normalize ( val || '' ) );
    }

    get expanded () {
        return this.#expanded;
    }

    set expanded ( val ) {
        this.#expanded = Boolean ( val );
        if ( this.#expanded ) {
            this.setAttribute ( 'expanded', '' );
        } else {
            this.removeAttribute ( 'expanded' );
        }
    }

    static get observedAttributes () { return [ 'name', 'path' ] }

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( !this.#updating ) {
            if ( name === 'name' ) {
                newVal = path.basename ( newVal || '' );
                if ( newVal !== path.basename ( oldVal || '' ) ) {
                    if ( this.dispatchEvent ( new CustomEvent ( 'rename', { detail: { oldName: oldVal, newName: newVal }, bubbles: true, cancelable: true } ) ) ) {
                        this.#name.textContent = newVal;
                    } else {
                        this.#updating = true;
                        this.name = oldVal;
                        this.#updating = false;
                    }
                }
            } else if ( name === 'path' ) {
                newVal = path.normalize ( newVal || '' );
                if ( newVal !== path.normalize ( oldVal || '' ) ) {
                    if ( !this.dispatchEvent ( new CustomEvent ( 'move', { detail: { oldPath: oldVal, newPath: newVal }, bubbles: true, cancelable: true } ) ) ) {
                        this.#updating = true;
                        this.path = oldVal;
                        this.#updating = false;
                    }
                }
            }
        }
    }

    connectedCallback () {
        let id = this.id;
        if ( !id ) {
            this.id = guid ();
        } else if ( !guids.has ( id ) ) {
            guids.add ( id );
        }
        this.draggable = true;
        this.tabIndex = 0;

        this.#updating = true;
        this.path = path.normalize ( this.path || '' );
        this.name = this.#name.textContent = path.basename ( this.name || '' );
        this.#updating = false;

        let node = this, depth = 0;
        while ( node.parentElement.tagName !== 'FILE-VIEW' ) {
            depth++;
            node = node.parentElement;
        }

        this.#wrapper.style.paddingLeft = `calc(${depth} * 2em)`;
    }

    editName () {
        const handleSubmit = event => {
            if ( event.key === 'Enter' ) {
                this.#name.contentEditable = false;
                this.removeEventListener ( 'keydown', handleSubmit );
                this.name = this.#name.textContent.trim ();
            } else if ( event.key === 'Escape' ) {
                this.#name.contentEditable = false;
                this.removeEventListener ( 'keydown', handleSubmit );
                this.name = this.getAttribute ( 'name' );
            }
        }
        this.addEventListener ( 'keydown', handleSubmit );
        this.#name.contentEditable = true;
        this.#name.focus ();
        let range = document.createRange ();
        range.setStart ( this.#name, 0 );
        range.setEnd ( this.#name, this.#name.textContent.replace ( /(\.[^.\\/]*)?$/, '').length );
    }
}

class FileNode extends HTMLElement {

    #shadow = null;
    #name = null;
    #icon = null;
    #slot = null;
    #updating = false;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( fileNodeTemplate.content.cloneNode ( true ) );
        this.#name = this.#shadow.getElementById ( 'name' );
        this.#icon = this.#shadow.getElementById ( 'icon' );
        this.#slot = this.#shadow.getElementById ( 'slot' );

        this.addEventListener ( 'dragstart', event => {
            event.dataTransfer.setData ( "text/plain", event.target.id );
            event.dataTransfer.dropEffect = 'move';
        } );
    }

    get name () {
        return this.getAttribute ( 'name' );
    }

    set name ( val ) {
        this.setAttribute ( 'name', path.basename ( val || '' ) );
    }

    get path () {
        return this.getAttribute ( 'path' );
    }

    set path ( val ) {
        if ( path.basename ( val || '' ) === this.name ) {
            val = path.dirname ( val || '' );
        }
        this.setAttribute ( 'path', path.normalize ( val || '' ) );
    }

    static get observedAttributes () { return [ 'name', 'path' ] }

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( !this.#updating ) {
            if ( name === 'name' ) {
                newVal = path.basename ( newVal || '' );
                if ( newVal !== path.basename ( oldVal || '' ) ) {
                    this.#name.textContent = newVal;
                    let type = mime.lookup ( newVal );
                    this.#icon.textContent = type ? icons [ type.split ( '/' ) [ 0 ] ] : icons.other;
                    this.dispatchEvent ( new CustomEvent ( 'rename', { detail: { oldName: oldVal, newName: newVal }, bubbles: true } ) );
                }
            } else if ( name === 'path' ) {
                newVal = path.normalize ( newVal || '' );
                if ( newVal !== path.normalize ( oldVal || '' ) ) {
                    this.dispatchEvent ( new CustomEvent ( 'move', { detail: { oldPath: oldVal, newPath: newVal }, bubbles: true } ) );
                }
            }
        }
    }

    connectedCallback () {
        let id = this.id;
        if ( !id ) {
            this.id = guid ();
        } else if ( !guids.has ( id ) ) {
            guids.add ( id );
        }
        this.draggable = true;
        this.tabIndex = 0;

        this.#updating = true;
        this.name = this.#name.textContent = path.basename ( this.name || '' );
        this.#updating = false;

        let node = this, depth = 0;
        while ( node.parentElement.tagName !== 'FILE-VIEW' ) {
            depth++;
            node = node.parentElement;
        }

        this.style.paddingLeft = `calc(${depth} * 2em)`;
    }

    editName () {
        const handleSubmit = event => {
            if ( event.key === 'Enter' ) {
                this.#name.contentEditable = false;
                this.removeEventListener ( 'keydown', handleSubmit );
                this.name = this.#name.textContent.trim ();
            } else if ( event.key === 'Escape' ) {
                this.#name.contentEditable = false;
                this.removeEventListener ( 'keydown', handleSubmit );
                this.name = this.getAttribute ( 'name' );
            }
        }
        this.addEventListener ( 'keydown', handleSubmit );
        this.#name.contentEditable = true;
        this.#name.focus ();
        let range = document.createRange ();
        range.setStart ( this.#name, 0 );
        range.setEnd ( this.#name, this.#name.textContent.replace ( /(\.[^.\\/]*)?$/, '').length );
    }
}

class FileOptionsMenu extends HTMLElement {

    #shadow = null;
    #content = null;
    #keyHandler = null;
    #focusHandler = null;

    constructor () {
        super ();
        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( fileOptionsMenuTemplate.content.cloneNode ( true ) );
        this.#content = this.#shadow.getElementById ( 'content' );

        this.#keyHandler = event => {
            let key = event.key, list = [], host = null;
            if ( key !== 'Alt' && key !== 'Control' && key !== 'Shift' ) {
                event.altKey && list.push ( 'alt' );
                event.ctrlKey && list.push ( 'ctrl' );
                event.shiftKey && list.push ( 'shift' );
                list.push ( event.key.toLowerCase () );
                key = list.join ( '-' );
                let client = this.#shadow.querySelector ( `[data-hotkey=${key}]` );
                if ( client ) {
                    let detail = client.dataset.value.toLowerCase ().split ( ' ' ).join ( '-' ),
                        host = this.getRootNode ().host;
                    if ( host.contains ( document.activeElement ) ) {
                        host.dispatchEvent ( new CustomEvent ( 'file-option', { detail } ) );
                    }
                }
            }
        };

        this.#focusHandler = event => this.hide ();
    }

    connectedCallback () {
        for ( let li of this.#content.children ) {
            if ( !li.children.length ) {
                if ( li.dataset.value ) {
                    let span = document.createElement ( 'span' );
                    span.textContent = li.dataset.value;
                    li.append ( span );
                    li.addEventListener ( 'click', event => {
                        let detail = li.dataset.value.toLowerCase ().split ( ' ' ).join ( '-' );
                        // this.getRootNode ().host.dispatchEvent ( new CustomEvent ( 'file-option', { detail } ) );
                        console.log ( 'file-option', event.detail );
                    } );
                }
                if ( li.dataset.hotkey ) {
                    let hotkey = li.dataset.hotkey.split ( '-' ),
                        key = hotkey.pop (),
                        span = document.createElement ( 'span' );
                    hotkey.sort ();
                    hotkey.push ( key );
                    li.dataset.hotkey = hotkey.join ( '-' );
                    span.textContent = li.dataset.hotkey;
                    li.append ( span );
                }
            }
        }

        // window.addEventListener ( 'keydown', this.#keyHandler );
        window.addEventListener ( 'pointerdown', this.#focusHandler );
    }

    disconnectedCallback () {
        window.removeEventListener ( 'keydown', this.#keyHandler );
        window.removeEventListener ( 'pointerdown', this.#focusHandler );
    }

    show () {
        this.classList.add ( 'active' );
    }

    hide () {
        this.classList.remove ( 'active' );
    }
}

customElements.define ( 'file-view', FileView );
customElements.define ( 'file-folder', FileFolder );
customElements.define ( 'file-node', FileNode );
customElements.define ( 'file-options', FileOptionsMenu );
