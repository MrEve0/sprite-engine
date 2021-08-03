( () => {
let icon_glyphs = "˃🖿🗋🗎🖽🎝📽👁🗑🗕🗖🗙";

const   fs = require ( 'fs' ),
        fsp = require ( 'fs/promises' ),
        path = require ( 'path' ),
        mime = require ( 'mime-types' ),
        trash = require ( 'trash' ),
        { Buffer } = require ( 'buffer' ),
        { guid, guids } = require ( '../src/shared/util.js' ),
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
        autoIndex = ( parent, name, isDir ) => {
            let ext, basename, root, indexed, index, sibling = null;
            if ( isDir ) {
                ext = '';
                root = path.basename ( name );
            } else {
                ext = path.extname ( name );
                basename = path.basename ( name );
                root = basename.slice ( 0, basename.lastIndexOf ( ext ) );
            }

            indexed = root.match ( /\((\d+)\)$/ );
            index = indexed ? Number ( indexed [ 1 ] ) + 1 : 1;

            while ( sibling = parent.querySelector ( `:scope > [name="${root}"]` ) ) {
                root = root.replace ( /(\(\d+\))?$/, `(${index})` );
                index += 1;
            }

            return path.join ( path.dirname ( name ), root + ext );
        },
        createFolder = ( target, folderName ) => {
            let folderPath = target.name ? path.join ( target.path, target.name ) : target.path;

            fs.mkdir ( path.join ( folderPath, folderName ), err => {

                if ( err ) throw err;

                let folder = document.createElement ( 'file-folder' );
                folder.name = folderName;
                folder.path = folderPath;
                target.prepend ( folder );
                setTimeout ( () => {
                    folder.editName ();
                }, 0 );
            } );
        },
        createFile = ( target, fileName, data ) => {
            let filePath = target.name ? path.join ( target.path, target.name ) : target.path,
                args = [ path.join ( filePath, name ) ];

            if ( !data ) args.push ( 'utf8' );

            fs.writeFile ( ...args, err => {
                if ( err ) throw err;

                let file = document.createElement ( 'file-node' );
                file.name = fileName;
                file.path = filePath;
                target.append ( file );

                setTimeout ( () => {
                    file.editName ();
                }, 0 );
            } );
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

class FileView extends HTMLElement {

    #shadow = null;
    #slot = null;
    #menu = null;
    #selected = null;
    #draggedOpen = null;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( fileViewTemplate.content.cloneNode ( true ) );
        this.#slot = this.#shadow.getElementById ( 'slot' );
        this.#menu = this.#shadow.getElementById ( 'menu' );
        this.#selected = new Set ();
        this.#draggedOpen = new Set ();

        // key/mouse focus traversal
        this.addEventListener ( 'focus', event => console.log ( 'file view focused...' ) );

        // should be triggered by keypress when has focus
        this.addEventListener ( 'paste', event => {
            console.log ( 'paste' );
            let selected = [ ...this.#selected ];
            selected = selected [ selected.length - 1 ];
            if ( selected.tagName === 'FILE-NODE' ) selected = selected.parentElement;

            navigator.clipboard.read ().then ( data => {
                for ( let item of data ) console.log ( item.types );
            } );
        } );

        // all menu commands take this route
        this.addEventListener ( 'file-option', event => {
            let options = this.#userInteractions;
            if ( event.detail in options ) {
                options [ event.detail ] ();
            }
        } );

        // for showing the menu on right click
        this.addEventListener ( 'pointerup', event => {
            if ( event.button === 2 ) {
                event.preventDefault ();
                let rect = this.getBoundingClientRect ();
                this.#menu.style.top = ( event.clientY - rect.top ) + 'px';
                this.#menu.style.left = ( event.clientX - rect.left ) + 'px';
                this.#menu.show ( event );
            }
        } );

        // select/multi-select
        this.addEventListener ( 'click', event => {
            const selectSiblingsFrom = ( first, last ) => {
                while ( first ) {
                    this.#selected.add ( first );
                    first.classList.add ( 'selected' );
                    if ( first.tagName === 'FILE-FOLDER' ) {
                        if ( first.firstElementChild ) {
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

                            selectSiblingsFrom ( first, last );
                        }
                    } else {
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

                    if ( event.target.tagName === 'FILE-FOLDER' ) event.target.expanded = !event.target.expanded;
                }
            }
        } );

        // expand folders on dragenter
        // maintains a list of expanded folders
        // if the list items do not contain the dragenter target ( parent folder for files, otherwise the folder )
        // they are reverted to their previous state
        // if the list does not contain the dragenter target, it is added
        // this.addEventListener ( 'dragenter', event => {
        //     console.log ( event.target );
        //     let target = event.target.tagName === 'FILE-NODE' ? event.target.parentElement : event.target;
        //     for ( let el of this.#draggedOpen ) {
        //         let child = el;
        //         while ( !child.contains ( target ) ) {
        //             if ( this.#draggedOpen.has ( child ) ) {
        //                 child.expanded = child.dataset.expanded === 'true';
        //                 delete child.dataset.expanded;
        //                 this.#draggedOpen.delete ( child );
        //                 child = child.parentElement;
        //             }
        //         }
        //     }
        //     if ( target !== this && !this.#draggedOpen.has ( target ) ) {
        //         this.#draggedOpen.add ( target );
        //         target.dataset.expanded = target.expanded;
        //         target.expanded = true;
        //     }
        // } );

        // this.addEventListener ( 'dragend', event => {
        //     // clean up
        //     for ( let el of this.#draggedOpen ) {
        //         el.expanded = el.dataset.expanded === 'true';
        //         delete el.dataset.expanded;
        //         this.#draggedOpen.delete ( el );
        //     }
        // } );

        this.addEventListener ( 'dragover', event => {
            let target = event.target.tagName === 'FILE-NODE' ? event.target.parentElement : event.target;
            if ( event.dataTransfer.files ) {
                event.preventDefault ();
                event.dataTransfer.dropEffect = 'copy';
                target.classList.add ( 'drop-target' );
            } else if ( !this.#selected.has ( target ) ) {
                event.preventDefault ();
                event.dataTransfer.dropEffect = 'move';
                target.classList.add ( 'drop-target' );
            }
        } );

        const removeDropTarget = event => {
            let target = event.target.tagName === 'FILE-NODE' ? event.target.parentElement : event.target;
            target.classList.remove ( 'drop-target' );
        }

        this.addEventListener ( 'dragleave', removeDropTarget );
        this.addEventListener ( 'dragexit', removeDropTarget );
        this.addEventListener ( 'dragend', removeDropTarget );
        this.addEventListener ( 'drop', removeDropTarget );

        this.addEventListener ( 'dragstart', event => {
            if ( event.target !== this ) {
                if ( !event.target.classList.contains ( 'selected' ) ) {
                    for ( let node of this.#selected ) node.classList.remove ( 'selected' );
                    this.#selected.clear ();
                    this.#selected.add ( event.target );
                    event.target.classList.add ( 'selected' );
                }
                event.dataTransfer.dropEffect = 'move';
            }
        } );

        this.addEventListener ( 'drop', event => {
            let transfer = event.dataTransfer,
                target = event.target.tagName === 'FILE-NODE' ? event.target.parentElement : event.target,
                copyFiles = async ( parent, files, remove ) => {
                    for ( let file of files ) {
                        if ( ( await fsp.stat ( file.path ) ).isDirectory () ) {
                            if ( path.join ( parent.path, parent.name || '', file.name ) !== file.path ) {
                                let destFolder = autoIndex ( parent, path.join ( parent.path, parent.name || '', file.name ), true ),
                                    subfolder = ( await fsp.readdir ( file.path ) ).map ( name => { path: path.join ( file.path, name ), name } );

                                await fsp.mkdir ( destFolder );
                                if ( file.node ) {
                                    file.node.classList.remove ( 'selected' );
                                    parent.append ( file.node );
                                } else {
                                    let folder = document.createElement ( 'file-folder' );
                                    folder.name = path.basename ( destFolder )
                                    folder.path = path.dirname ( destFolder );
                                    parent.append ( folder );
                                }
                                await copyFiles ( folder, subfolder );
                                if ( remove ) await fsp.rm ( file.path );
                            }
                        } else {
                            if ( path.join ( parent.path, parent.name || '', file.name ) !== file.path ) {
                                await fsp.copyFile ( file.path, autoIndex ( parent, path.join ( parent.path, parent.name || '', file.name ), false ) );
                                if ( file.node ) {
                                    parent.append ( file.node )
                                } else {
                                    let fileNode = document.createElement ( 'file-node' );
                                    fileNode.name = file.name;
                                    fileNode.path = path.join ( parent.path, parent.name || '' );
                                    parent.append ( fileNode );
                                }
                                if ( remove ) await fsp.rm ( file.path );
                            }
                        }
                    }
                };

            if ( transfer.files.length ) {
                event.preventDefault ();
                copyFiles ( target, transfer.files );
            } else {
                // negotiate valid drop target
                // folders cannot be dropped inside themselves
                if ( !this.#selected.has ( target ) ) {
                    event.preventDefault ();
                    copyFiles ( target, [ ...this.#selected ].map ( node => {
                        return { path: path.join ( node.path, node.name ), name: node.name, node };
                    } ), true );
                }
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

        this.addEventListener ( 'rename', event => {
            let oldPath = path.join ( event.target.path, event.detail.oldName ),
                newPath = path.join ( event.target.path, event.detail.newName );

            if ( event.detail.type === 'folder' ) event.detail.callforward ();

            fs.rename ( oldPath, newPath, err => {

                if ( err ) {
                    throw err;
                }

                onslotchange ( event );
                if ( event.detail.type === 'folder' ) event.detail.callback ();
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
            'new-file': () => {
                let target = this.#selected.length ? this.#selected [ this.#selected.length - 1 ] : this.#menu.target || this;
                if ( target.tagName === 'FILE-NODE' ) target = target.parentElement;
                if ( this.contains ( target ) ) createFile ( target, autoIndex ( target, 'newFile', false ), '' );
            },
            'new-folder': () => {
                let target = this.#selected.length ? this.#selected [ this.#selected.length - 1 ] : this.#menu.target || this;
                if ( target.tagName === 'FILE-NODE' ) target = target.parentElement;
                if ( this.contains ( target ) ) createFolder ( target, autoIndex ( target, 'newFolder', true ) );
            },
            'rename': () => {
                let target = this.#selected.length ? this.#selected [ this.#selected.length - 1 ] : this.#menu.target || this;
                if ( this.contains ( target ) ) target.editName ();
            },
            'duplicate': () => {
                const   copyFile = ( source, target, element ) => {
                            fs.writeFileSync ( target, fs.readFileSync ( source ) );

                            let newFile = document.createElement ( 'file-node' );
                            newFile.name = path.basename ( target );
                            newFile.path = element.path;
                            element.parentElement.insertBefore ( newFile, element.nextSibling );
                        },
                        copyFolder = ( source, target, element ) => {
                            let folder = path.join ( target, path.basename ( source ) ),
                                files = fs.readdirSync ( source ),
                                newFolder = document.createElement ( 'file-folder' );

                            newFolder.name = path.basename ( target );
                            newFolder.path = element.path;
                            element.parentElement.insertBefore ( newFolder, element.nextSibling );

                            if ( !fs.existsSync ( folder ) ) fs.mkdirSync ( folder );

                            files.forEach ( file => {
                                let cur = path.join ( element.path, file ),
                                    node = null;
                                if ( fs.lstatSync ( cur ).isDirectory () ) {
                                    node = document.createElement ( 'file-folder' );
                                    node.path = cur;
                                    node.name = path.basename ( file );
                                    newFolder.append ( node );
                                    copyFolder ( cur, folder, node );
                                } else {
                                    node = document.createElement ( 'file-node' );
                                    node.path = path.join ( newFolder.path, newFolder.name );
                                    node.name = path.basename ( file );
                                    newFolder.append ( node );
                                    copyFile ( cur, folder, node );
                                }
                            } );

                            return newFolder;
                        };
                let target = this.#selected.length ? this.#selected [ this.#selected.length - 1 ] : this;
                if ( this.contains ( target ) ) {
                    let targetPath = target.path,
                        name = target.name,
                        src = path.join ( targetPath, name );
                    if ( fs.lstatSync ( src ).isDirectory () ) {
                        let folder = copyFolder ( src, autoIndex ( target.parentElement, src ), target );
                        setTimeout ( () => {
                            folder.editName ();
                        }, 0 )
                    } else {
                        let file = copyFile ( src, autoIndex ( target.parentElement, src ), target );
                        setTimeout ( () => {
                            file.editName ();
                        }, 0 );
                    }
                }
            },
            'delete': () => {
                let selected = this.#selected.length ? this.#selected : [ this.#menu.target ];

                for ( let target of selected ) {
                    if ( this.contains ( target ) ) {
                        trash ( path.join ( target.path, target.name ), { glob: false } ).then ( () => {
                            target.remove ();
                        } );
                    }
                }
            },
            'copy': () => {

                const asyncCopy = async source => {
                    let table = [],
                        table_length = new Int32Array ( 1 ),
                        sources = [], buffer, size = 0;
                    if ( source.tagName === 'FILE-FOLDER' ) {
                        for ( let child of [ ...source.children ] ) {
                            let childsource = await asyncCopy ( child );
                            buffer = await childsource.arrayBuffer ();
                            sources.push ( buffer );
                            size += buffer.byteLength;
                        }
                        table.push ( { name: source.name, type: 'folder', size } );
                    } else {
                        buffer = await fsp.readFile ( path.join ( source.path, source.name ) );
                        sources.push ( buffer );
                        table.push ( { name: source.name, type: 'file' } )
                    }
                    table = JSON.stringify ( table );
                    table_length [ 0 ] = table.length;
                    sources.unshift ( table_length, table );
                    return new Blob ( sources, { type: 'application/octet-stream' } );
                };

                let selected = ( this.#selected.length ? this.#selected : [ this.#menu.target ] ).map ( item => item.id );

                for ( let target of selected ) {
                    if ( this.contains ( target ) ) {
                        asyncCopy ( target ).then ( blob => {
                            navigator.clipboard.write ( [ new ClipboardItem ( { 'text/plain': new Blob ( [ 'file-system-entry' ], { type: 'text/plain' } ), [ blob.type ]: blob } ) ] );
                        } );
                    }
                }
            },
            'cut': () => {
                this.#userInteractions.copy ();
                this.#userInteractions.delete ();
            },
            'paste': () => {
                const asyncReadEntry = async ( item ) => {
                    let text, octet;
                    if ( item.types.includes ( 'text/plain' ) ) text = await item.getType ( 'text/plain' );
                    if ( item.types.includes ( 'application/octet-stream' ) ) octet = await item.getType ( 'application/octet-stream' );
                    if ( text === 'file-system-entry' ) return await octet.arrayBuffer ();
                },
                asyncPaste = async ( target, buffer ) => {
                    let headerLength = ( new Int32Array ( buffer.slice ( 0, 4 ) ) ) [ 0 ],
                        entry = JSON.parse ( String.fromCharCodes ( new Uint8Array ( buffer.slice ( 4, headerLength + 4 ) ) ) ),
                        data = buffer.slice ( headerLength + 4, entry.size + headerLength + 4 );
                    if ( entry.type === 'folder' ) {
                        let name = autoIndex ( target, entry.name, true ),
                            folderPath = path.join ( target.path, target.name, name );
                            confirm = fsp.mkdir ( folderPath, { recursive: true } );

                        if ( confirm === folderPath ) {
                            let view = document.createElement ( 'file-folder' );
                            view.name = name;
                            target.append ( view );
                            await asyncPaste ( view, data );
                        }
                    } else {
                        let name = autoIndex ( target, entry.name, false ),
                            filePath = path.join ( target.path, target.name, name ),
                            err = await fsp.writeFile ( filePath, data );

                        if ( err ) throw err;

                        let view = document.createElement ( 'file-node' );
                        view.name = name;
                        target.append ( view );
                    }
                },
                asyncPasteItems = async ( target, items ) => {
                    for ( let item of items ) {
                        let buffer = await asyncReadEntry ( item );
                        if ( buffer ) {
                            await asyncPaste ( target, buffer );
                        }
                    }
                };
                const   updatePath = ( parent, path ) => {
                            for ( let child of parent.children ) {
                                child.path = path.join ( path, child.path );
                                if ( child.tagName === "FILE-FOLDER" ) {
                                    updatePath ( child, child.path );
                                }
                            }
                        };

                let target = this.#selected.length ? this.#selected [ this.#selected.length - 1 ] : this.#menu.target;

                if ( this.contains ( target ) ) {
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
            'copy-full-path': () => {
                let selected = ( this.#selected.length ? this.#selected : [ this.#menu.target ] ).map ( item => path.join ( item.path, item.name ) );

                if ( this.contains ( target ) ) {
                    let type = 'application/json';

                    navigator.clipboard.write ( [ new ClipboardItem ( {
                        [ type ]: new Blob ( [ JSON.stringify ( selected ) ], { type } )
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
        this.tabIndex = 0;
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
    #watch = null;
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
        this.#watch = ( event, name ) => {
            console.log ( event, name );
        };

        // this.addEventListener ( 'click', event => {
        //     if ( event.target === this ) {
        //         if ( !( event.shiftKey || event.ctrlKey ) ) {
        //             this.expanded = !this.expanded;
        //         }
        //     }
        // } );

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
                if ( !newVal ) {
                    setTimeout ( () => {
                        this.dispatchEvent ( new CustomEvent ( 'alert', { detail: { type: 'warning', message: 'invalid file name ""' }, bubbles: true, cancelable: true } ) );
                        this.editName ();
                    }, 0 );
                } else if ( oldVal && newVal && newVal !== path.basename ( oldVal || '' ) ) {
                    if ( this.isConnected ) {
                        if ( this.dispatchEvent ( new CustomEvent ( 'rename', { detail: { oldName: oldVal, newName: newVal, type: 'folder',
                            callforward: () => fs.unwatchFile ( path.join ( this.path, this.name ), this.#watch ),
                            callback: () => fs.watch ( path.join ( this.path, this.name ), this.#watch )
                        }, bubbles: true, cancelable: true } ) ) ) {
                            this.#name.textContent = newVal;
                        } else {
                            this.#updating = true;
                            this.name = oldVal;
                            this.#updating = false;
                        }
                    }
                }
            } else if ( name === 'path' ) {
                newVal = path.normalize ( newVal || '' );
                if ( newVal !== path.normalize ( oldVal || '' ) ) {
                    if ( this.isConnected ) {
                        fs.unwatchFile ( path.join ( this.path, this.name ), this.#watch );
                        if ( !this.dispatchEvent ( new CustomEvent ( 'move', { detail: { oldPath: oldVal, newPath: newVal }, bubbles: true, cancelable: true } ) ) ) {
                            this.#updating = true;
                            this.path = oldVal;
                            this.#updating = false;
                        }
                        fs.watch ( path.join ( this.path, this.name ), this.#watch );
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
        this.spellcheck = false;

        this.#updating = true;
        this.path = this.parentElement.tagName === 'FILE-FOLDER' ? path.join ( this.parentElement.path, this.parentElement.name ) : path.normalize ( this.path || '' );
        this.name = this.#name.textContent = path.basename ( this.name || '' );
        fs.watch ( path.join ( this.path, this.name ), this.#watch );
        this.#updating = false;

        let node = this, depth = 0;
        while ( node.parentElement.tagName !== 'FILE-VIEW' ) {
            depth++;
            node = node.parentElement;
        }

        this.#wrapper.style.paddingLeft = `calc(${depth} * 2em)`;
    }

    disconnectedCallback () {
        fs.unwatchFile ( path.join ( this.path, this.name ), this.#watch );
    }

    editName () {
        const handleSubmit = event => {
            if ( event.key === 'Enter' ) {
                let name = this.#name.textContent.trim ();
                if ( name ) {
                    if ( name !== this.name ) {
                        this.#name.contentEditable = false;
                        this.removeEventListener ( 'keydown', handleSubmit );
                        this.name = name;
                    }
                } else {
                    event.preventDefault ();
                }
            } else if ( event.key === 'Escape' ) {
                this.#name.contentEditable = false;
                this.removeEventListener ( 'keydown', handleSubmit );
                this.#updating = true;
                this.#name.textContent = this.name = this.getAttribute ( 'name' );
                this.#updating = false;
            }
        }
        this.#name.addEventListener ( 'blur', event => this.#name.contentEditable = false, { once: true } );
        this.addEventListener ( 'keydown', handleSubmit );
        this.#name.contentEditable = true;
        setTimeout ( () => {
            this.#name.focus ();
            if ( this.#name.textContent ) {
                let range = document.createRange (),
                    node = this.#name.childNodes [ 0 ],
                    selection = window.getSelection ();
                range.setStart ( node, 0 );
                range.setEnd ( node, node.textContent.length );
                selection.removeAllRanges ();
                selection.addRange ( range );
            }
        }, 0 );
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
                if ( !newVal ) {
                    setTimeout ( () => {
                        this.dispatchEvent ( new CustomEvent ( 'alert', { detail: { type: 'warning', message: 'invalid name ""' }, bubbles: true, cancelable: true } ) );
                        this.editName ();
                    }, 0 );
                } else if ( oldVal && newVal && path.basename ( newVal ) !== oldVal ) {
                    if ( this.isConnected ) {
                        if ( this.dispatchEvent ( new CustomEvent ( 'rename', { detail: { oldName:  oldVal, newName: newVal, type: 'file' }, bubbles: true } ) ) ) {
                            this.#name.textContent = newVal;
                            let type = mime.lookup ( newVal );
                            this.#icon.textContent = type ? icons [ type.split ( '/' ) [ 0 ] ] : icons.other;
                        }
                    }
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
        this.spellcheck = false;

        this.#updating = true;
        this.path = this.parentElement.tagName === 'FILE-FOLDER' ? path.join ( this.parentElement.path, this.parentElement.name ) : path.normalize ( this.path || '' );
        this.name = this.#name.textContent = path.basename ( this.name || '' );
        let type = mime.lookup ( this.name );
        this.#icon.textContent = type ? icons [ type.split ( '/' ) [ 0 ] ] : icons.other;
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
                let name = this.#name.textContent.trim ();
                if ( name ) {
                    this.#name.contentEditable = false;
                    this.removeEventListener ( 'keydown', handleSubmit );
                    this.name = name;
                } else {
                    event.preventDefault ();
                }
            } else if ( event.key === 'Escape' ) {
                this.#name.contentEditable = false;
                this.removeEventListener ( 'keydown', handleSubmit );
                this.#updating = true;
                this.name = this.getAttribute ( 'name' );
                this.#updating = false;
            }
        }
        this.#name.addEventListener ( 'blur', event => this.#name.contentEditable = false, { once: true } );
        this.addEventListener ( 'keydown', handleSubmit );
        this.#name.contentEditable = true;
        setTimeout ( () => {
            this.#name.focus ();
            if ( this.#name.textContent ) {
                let range = document.createRange (),
                    node = this.#name.childNodes [ 0 ],
                    selection = window.getSelection ();
                range.setStart ( node, 0 );
                range.setEnd ( node, node.textContent.replace ( /(\.[^.\\/]*)?$/, '').length );
                selection.removeAllRanges ();
                selection.addRange ( range );
            }
        }, 0 );
    }
}

class FileOptionsMenu extends HTMLElement {

    #shadow = null;
    #content = null;
    #keyHandler = null;
    #focusHandler = null;
    #target = null;

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
        const onclick = event => {
            let detail = event.currentTarget.dataset.value.toLowerCase ().split ( ' ' ).join ( '-' );
            this.getRootNode ().host.dispatchEvent ( new CustomEvent ( 'file-option', { detail } ) );
            this.#target = null;
        };
        for ( let li of this.#content.children ) {
            if ( !li.children.length ) {
                if ( li.dataset.value ) {
                    let span = document.createElement ( 'span' );
                    span.textContent = li.dataset.value;
                    li.append ( span );
                    li.addEventListener ( 'click', onclick );
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
        window.addEventListener ( 'click', this.#focusHandler );
    }

    disconnectedCallback () {
        window.removeEventListener ( 'keydown', this.#keyHandler );
        window.removeEventListener ( 'click', this.#focusHandler );
    }

    get target () {
        return this.#target;
    }

    show ( event ) {
        this.#target = event.target;
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
} ) ();
