( () => {
let icon_glyphs = "˃🖿🗋🗎🖽🎝📽👁🗑🗕🗖🗙🔒︎";

const   { guid, guids } = require ( '../src/shared/util.js' ),
        fs = require ( 'fs' ),
        autoIndex = ( parent, name ) => {
            let indexed = root.match ( /\((\d+)\)$/ ),
                index = indexed ? Number ( indexed [ 1 ] ) + 1 : 1;

            while ( sibling = parent.querySelector ( `:scope > [name="${root}"]` ) ) {
                name = name.replace ( /(\(\d+\))?$/, `(${index})` );
                index += 1;
            }

            return name;
        },
        layerViewTemplate = document.createElement ( 'template' ),
        layerNodeTemplate = document.createElement ( 'template' ),
        layerOptionsTemplate = document.createElement ( 'template' ),
        layeredSceneTemplate = document.createElement ( 'template' ),
        sceneLayerTemplate = document.createElement ( 'template' );

if ( !require.extensions [ '.html' ] ) {
    require.extensions [ '.html' ] = function ( module, filename ) {
        module.exports = fs.readFileSync ( filename, 'utf8' ).replace ( /\n\s*/g, '' );
    };
}

layerViewTemplate.innerHTML = require ( '../src/html/layer-view.html' ).replace ( /\n\s*/g, '' );
layerNodeTemplate.innerHTML = require ( '../src/html/layer-node.html' ).replace ( /\n\s*/g, '' );
layerOptionsTemplate.innerHTML = require ( '../src/html/layer-options.html' ).replace ( /\n\s*/g, '' );
layeredSceneTemplate.innerHTML = require ( '../src/html/layered-scene.html' ).replace ( /\n\s*/g, '' );
sceneLayerTemplate.innerHTML = require ( '../src/html/scene-layer.html' ).replace ( /\n\s*/g, '' );

class LayerView extends HTMLElement {

    #shadow = null;
    #slot = null;
    #menu = null;
    #selected = null;
    #clickHandler = null;
    #dragging = null;
    #views = null;
    #updating = false;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( layerViewTemplate.content.cloneNode ( true ) );
        this.#slot = this.#shadow.getElementById ( 'slot' );
        this.#menu = this.#shadow.getElementById ( 'menu' );
        this.#selected = new Set ();
        this.#clickHandler = event => {
            if ( event.target === this || !this.contains ( event.target ) ) {
                this.#selected.forEach ( el => el.classList.remove ( 'selected' ) );
                this.#selected.clear ();
            }
        };
        this.#views = new Map ();

        this.addEventListener ( 'layer-option', event => {
            let options = this.#userInteractions;
            if ( event.detail in options ) {
                options [ event.detail ] ( event );
            }
        } );

        this.addEventListener ( 'pointerdown', downthis => {
            if ( downthis.target !== this && this.contains ( downthis.target ) ) {
                if ( downthis.pointerType === 'mouse' && downthis.button === 1 || downthis.isPrimary ) {
                    const   onmovewin = movewin => {
                                if ( movewin.pointerId === downthis.pointerId ) {
                                    if ( !downthis.target.classList.contains ( 'dragging' ) ) {
                                        downthis.target.classList.add ( 'dragging' );
                                        this.#dragging = downthis.target;
                                        downthis.preventDefault ();
                                    }
                                    downthis.target.offsety += movewin.movementY;

                                    let list = document.elementsFromPoint ( movewin.clientX, movewin.clientY );
                                    for ( let over of list ) {
                                        if ( over !== downthis.target && over.parentElement === this ) {
                                            let order = over.compareDocumentPosition ( downthis.target );
                                            // DOCUMENT_POSITION_PRECEDING : 2
                                            if ( order === 2 ) {
                                                let rect = over.getBoundingClientRect ();
                                                this.insertBefore ( over, downthis.target );
                                                downthis.target.offsety -= rect.height;
                                            // DOCUMENT_POSITION_FOLLOWING : 4
                                            } else if ( order === 4 ) {
                                                let rect = over.getBoundingClientRect ();
                                                this.insertBefore ( over, downthis.target.nextSibling );
                                                downthis.target.offsety += rect.height;
                                            }

                                            break;
                                        }
                                    }
                                }
                            },
                            onupwin = upwin => {
                                if ( this.#dragging ) {
                                    this.#dragging.classList.remove ( 'dragging' );
                                    this.#dragging.offsety = 0;
                                    this.#dragging = null;
                                }
                                window.removeEventListener ( 'pointermove', onmovewin );
                            },
                            onupthis = upthis => {
                                if ( upthis.button === 2 ) {
                                    let rect = this.getBoundingClientRect ();
                                    this.#menu.style.top = ( upthis.clientY - rect.top ) + 'px';
                                    this.#menu.style.left = ( upthis.clientX - rect.left ) + 'px';
                                    this.#menu.show ( upthis );
                                }
                            },
                            onclickthis = clickthis => {
                                if ( clickthis.target !== this && !downthis.defaultPrevented ) {
                                    if ( clickthis.shiftKey ) {
                                        let sel = [ ...this.#selected ], first, last, position;
                                        if ( sel.length ) {
                                            sel = sel [ sel.length - 1 ];

                                            if ( clickthis.target.parentElement === sel.parentElement ) {
                                                // https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
                                                position = clickthis.target.compareDocumentPosition ( sel );
                                                // DOCUMENT_POSITION_PRECEDING : 2
                                                if ( position === 2 ) {
                                                    first = sel;
                                                    last = clickthis.target;
                                                // DOCUMENT_POSITION_FOLLOWING : 4
                                                } else if ( position === 4 ) {
                                                    first = clickthis.target;
                                                    last = sel;
                                                }

                                                while ( first ) {
                                                    this.#selected.add ( first );
                                                    first.classList.add ( 'selected' );
                                                    if ( first === last ) break;
                                                    first = first.nextSibling;
                                                }
                                            }
                                        } else {
                                            this.#selected.forEach ( el => el.classList.remove ( 'selected' ) );
                                            this.#selected.clear ();
                                            this.#selected.add ( clickthis.target );
                                            clickthis.target.classList.add ( 'selected' );
                                        }
                                    } else if ( clickthis.ctrlKey ) {
                                        if ( this.#selected.has ( clickthis.target ) ) {
                                            this.#selected.delete ( clickthis.target );
                                            clickthis.target.classList.remove ( 'selected' );
                                        } else {
                                            this.#selected.add ( clickthis.target );
                                            clickthis.target.classList.add ( 'selected' );
                                        }
                                    } else {
                                        this.#selected.forEach ( el => el.classList.remove ( 'selected' ) );
                                        this.#selected.clear ();
                                        this.#selected.add ( clickthis.target );
                                        clickthis.target.classList.add ( 'selected' );
                                    }
                                }
                            },
                            once = { once: true };
                    window.addEventListener ( 'pointermove', onmovewin );
                    window.addEventListener ( 'pointerup', onupwin, once );
                    this.addEventListener ( 'pointerup', onupthis, once );
                    this.addEventListener ( 'click', onclickthis, once );
                }
            }
        } );

        this.#slot.addEventListener ( 'slotchange', event => {
            let assigned = this.#slot.assignedElements ();
            assigned.filter ( child => child.tagName === "LAYER-NODE" ).forEach ( ( child, index ) => {
                child.depth = index;
                let target = document.getElementById ( child.target );
                if ( !target ) {
                    let scene = document.getElementById ( this.target );
                    if ( scene ) {
                        child.target = scene.createLayer ( child );
                    }
                }
            } );
        } );
    }

    get #userInteractions() {
        return {
            'new-layer': event => {
                let layer = document.createElement ( 'layer-node' );
                layer.name = 'New Layer';
                layer.visible = true;
                layer.locked = false;
                layer.depth = 0;
                this.prepend ( layer );
                layer.editName ();
            },
            'toggle-visible': event => {
                event.target.visible = !event.target.visible;
            },
            'toggle-locked': event => {
                event.target.locked = !event.target.locked;
            },
            'move-up': event => {
                this.insertBefore ( event.target, event.target.previousSibling );
            },
            'move-down': event => {
                this.insertBefore ( event.target, event.target.nextSibling && event.target.nextSibling.nextSibling || null );
            },
            'rename': event => {
                event.target.editName ();
            },
            'duplicate': event => {
                let layer = document.createElement ( 'layer-node' );
                layer.name = event.target.name;
                layer.visible = event.target.visible;
                layer.locked = event.target.locked;
                layer.depth = event.target.depth - 1;
                this.insertBefore ( layer, event.target );
            },
            'delete': event => {},
            'copy': event => {},
            'cut': event => {},
            'paste': event => {},
        }
    }

    get target () {
        return this.getAttribute ( 'target' );
    }

    set target ( val ) {
        this.setAttribute ( 'target', val );
    }

    get name () {
        return this.getAttribute ( 'name' );
    }

    set name ( val ) {
        this.setAttribute ( 'name', val || '' );
    }

    get height () {
        return Number ( this.getAttribute ( 'height' ) ) || 0;
    }

    set height ( val ) {
        this.setAttribute ( 'height', Number ( val ) || 0 );
    }

    get width () {
        return Number ( this.getAttribute ( 'width' ) ) || 0;
    }

    set width ( val ) {
        this.setAttribute ( 'width', Number ( val ) || 0 );
    }

    static get observedAttributes () { return [ 'target', 'name', 'height', 'width' ] }

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( !this.#updating ) {
            if ( name === 'target' ) {
                let newTarget = document.getElementById ( newVal );
                if ( newTarget && newTarget.tagName === 'LAYERED-SCENE' ) {
                    if ( this.#views.has ( this.target ) ) {
                        while ( this.firstElementChild ) this.firstElementChild.remove ();
                    } else {
                        let frag = new DocumentFragment ();
                        frag.append ( ...this.children );
                        this.#views.set ( this.target, frag );
                    }
                    let clients = this.#views.get ( newTarget.id );
                    if ( clients ) {
                        this.append ( clients );
                    } else {
                        [ ...newTarget.children ].sort ( ( a, b ) => b.depth - a.depth ).forEach ( ( child, index ) => {
                            let view = document.createElement ( 'layer-node' );
                            view.target = child.id;
                            view.name = child.name;
                            view.visible = child.visible;
                            view.locked = child.locked;
                            view.depth = index;
                            this.append ( view );
                        } );
                    }
                }
            } else if ( name === 'name' ) {
                let target = document.getElementById ( this.target );

                if ( target ) {
                    target.name = newVal;
                }
            } else if ( name === 'height' ) {
                let target = document.getElementById ( this.target );

                if ( target ) {
                    target.height = newVal;
                }
            } else if ( name === 'width' ) {
                let target = document.getElementById ( this.target );

                if ( target ) {
                    target.width = newVal;
                }
            }
        }
    }
}

class LayerNode extends HTMLElement {

    #shadow = null;
    #offset = null;
    #name = null;
    #visible = null;
    #locked = null;
    #updating = false;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( layerNodeTemplate.content.cloneNode ( true ) );
        this.#offset = this.#shadow.getElementById ( 'offset' );
        this.#visible = this.#shadow.getElementById ( 'visible' );
        this.#locked = this.#shadow.getElementById ( 'locked' );
        this.#name = this.#shadow.getElementById ( 'name' );

        this.#visible.addEventListener ( 'click', event => {
            this.visible = !this.visible;
            event.preventDefault ();
            event.stopPropagation ();
        } );

        this.#locked.addEventListener ( 'click', event => {
            this.locked = !this.locked;
            event.preventDefault ();
            event.stopPropagation ();
        } );
    }

    get name () {
        return this.getAttribute ( 'name' );
    }

    set name ( val ) {
        this.setAttribute ( 'name', val );
    }

    get visible () {
        return this.hasAttribute ( 'visible' );
    }

    set visible ( val ) {
        if ( !!val ) {
            this.setAttribute ( 'visible', '' );
        } else {
            this.removeAttribute ( 'visible' );
        }
    }

    get locked () {
        return this.hasAttribute ( 'locked' );
    }

    set locked ( val ) {
        if ( !!val ) {
            this.setAttribute ( 'locked', '' );
        } else {
            this.removeAttribute ( 'locked' );
        }
    }

    get depth () {
        return Number ( this.getAttribute ( 'depth' ) ) || 0;
    }

    set depth ( val ) {
        this.setAttribute ( 'depth', Number ( val ) || 0 );
    }

    get offsetx () {
        return Number ( this.getAttribute ( 'offsetx' ) ) || 0;
    }

    set offsetx ( val ) {
        this.setAttribute ( 'offsetx', Number ( val ) || 0 );
    }

    get offsety () {
        return Number ( this.getAttribute ( 'offsety' ) ) || 0;
    }

    set offsety ( val ) {
        this.setAttribute ( 'offsety', Number ( val ) || 0 );
    }

    static get observedAttributes () { return [ 'name', 'visible', 'locked', 'depth', 'offsetx', 'offsety' ]; }

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( !this.#updating ) {
            let target = document.getElementById ( this.target );
            if ( target ) {
                if ( name === 'name' ) {
                    this.#name.textContent = newVal;
                    target.name = newVal;
                } else if ( name === 'visible' ) {
                    target.visible = Boolean ( newVal );
                } else if ( name === 'locked' ) {
                    target.locked = Boolean ( newVal );
                } else if ( name === 'depth' ) {
                    target.depth = Number ( newVal ) || 0;
                } else if ( name === 'offsetx' ) {
                    newVal = Number ( newVal ) || 0;
                    this.#offset.style.left = newVal ? newVal + 'px' : '';
                } else if ( name === 'offsety' ) {
                    newVal = Number ( newVal ) || 0;
                    this.#offset.style.top = newVal ? newVal + 'px' : '';
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

        this.tabIndex = 0;
        this.#name.textContent = this.name;
    }

    disconnectedCallback () {}

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
                range.setEnd ( node, node.textContent.length );
                selection.removeAllRanges ();
                selection.addRange ( range );
            }
        }, 0 );
    }
}

class LayerOptions extends HTMLElement {

    #shadow = null;
    #content = null;
    #keyHandler = null;
    #focusHandler = null;
    #target = null;

    constructor () {
        super ();
        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( layerOptionsTemplate.content.cloneNode ( true ) );
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
                        host.dispatchEvent ( new CustomEvent ( 'layer-option', { detail } ) );
                    }
                }
            }
        };

        this.#focusHandler = event => this.hide ();
    }

    connectedCallback () {
        const onclick = event => {
            let detail = event.currentTarget.dataset.value.toLowerCase ().split ( ' ' ).join ( '-' );
            if ( this.#target ) {
                this.#target.dispatchEvent ( new CustomEvent ( 'layer-option', { detail, bubbles: true, cancelable: true } ) );
                this.#target = null;
            }
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

        window.addEventListener ( 'keydown', this.#keyHandler );
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

class LayeredScene extends HTMLElement {

    #shadow = null;
    #slot = null;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( layeredSceneTemplate.content.cloneNode ( true ) );
        this.#slot = this.#shadow.getElementById ( 'slot' );

        this.#slot.addEventListener ( 'slotchange', event => {
            let assigned = this.#slot.assignedElements (),
                count = assigned.length;
            assigned.forEach ( child => {
                child.style.zIndex = count - child.depth;
            } )
        } )
    }

    get name () {
        return this.getAttribute ( 'name' );
    }

    set name ( val ) {
        this.setAttribute ( 'name', val );
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

    get height () {
        return Number ( this.getAttribute ( 'height' ) ) || 0;
    }

    set height ( val ) {
        this.setAttribute ( 'height', Number ( val ) || 0 );
    }

    get width () {
        return Number ( this.getAttribute ( 'width' ) ) || 0;
    }

    set width ( val ) {
        this.setAttribute ( 'width', Number ( val ) || 0 );
    }

    get layers () {
        return this.#slot.assignedElements ().sort ( ( a, b ) => b.style.zIndex - a.style.zIndex )
    }

    createLayer ( client ) {
        let layer = document.createElement ( 'scene-layer' );

        layer.name = client.name;
        layer.height = client.height;
        layer.width = client.width;
        layer.visible = client.visible;
        layer.locked = client.locked;
        layer.depth = client.depth;

        // id is created with connected to the document
        this.append ( layer );

        if ( this.isConnected ) {
            return layer.id;
        } else {
            layer.id = guid ();
        }

        return layer.id;
    }

    static get observedAttributes () { return [ 'name', 'path', 'height', 'width' ] }

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( this.constructor.observedAttributes.includes ( name ) ) {
            this.dispatchEvent ( new CustomEvent ( 'attribute-changed', { detail: { name, oldVal, newVal }, bubbles: true, cancelable: true } ) );
        }
    }

    connectedCallback () {
        let id = this.id;
        if ( !id ) {
            this.id = guid ();
        } else if ( !guids.has ( id ) ) {
            guids.add ( id );
        }
    }
}

class SceneLayer extends HTMLElement {

    #shadow = null;
    #canvas = null;
    #context = null;
    #resize = null;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( sceneLayerTemplate.content.cloneNode ( true ) );
        this.#canvas = this.#shadow.getElementById ( 'canvas' );
        this.#context = this.#canvas.getContext ( 'webgl' );
        this.#resize = event => {
            this.#canvas.width = this.#canvas.clientWidth;
            this.#canvas.height = this.#canvas.clientHeight;
        };
    }

    get name () {
        return this.getAttribute ( 'name' );
    }

    set name ( val ) {
        this.setAttribute ( 'name', val );
    }

    get height () {
        return Number ( this.getAttribute ( 'height' ) ) || 0;
    }

    set height ( val ) {
        this.setAttribute ( 'height', Number ( val ) || 0 );
    }

    get width () {
        return Number ( this.getAttribute ( 'width' ) ) || 0;
    }

    set width ( val ) {
        this.setAttribute ( 'width', Number ( val ) || 0 );
    }

    get visible () {
        return this.hasAttribute ( 'visible' );
    }

    set visible ( val ) {
        val = !!val;
        if ( val ) {
            this.setAttribute ( 'visible', '' );
        } else {
            this.removeAttribute ( 'visible' );
        }
    }

    get locked () {
        return this.hasAttribute ( 'locked' );
    }

    set locked ( val ) {
        val = !!val;
        if ( val ) {
            this.setAttribute ( 'locked', '' );
        } else {
            this.removeAttribute ( 'locked' );
        }
    }

    get depth () {
        return Number ( this.getAttribute ( 'depth' ) ) || 0;
    }

    set depth ( val ) {
        val = Number ( val ) || 0;
        this.setAttribute ( 'depth', val );
    }

    static get observedAttributes () { return [ 'name', 'height', 'width', 'visible', 'locked', 'depth' ] }

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( this.constructor.observedAttributes.includes ( name ) ) {
            this.dispatchEvent ( new CustomEvent ( 'attribute-changed', { detail: { name, oldVal, newVal }, bubbles: true, cancelable: true } ) );
        }
    }

    get context () {
        return this.#context;
    }

    connectedCallback () {
        let id = this.id;
        if ( !id ) {
            this.id = guid ();
        } else if ( !guids.has ( id ) ) {
            guids.add ( id );
        }

        window.addEventListener ( 'resize', this.#resize );
    }

    disconnectedCallback () {
        window.removeEventListener ( 'resize', this.#resize );
    }
}

customElements.define ( 'layer-view', LayerView );
customElements.define ( 'layer-node', LayerNode );
customElements.define ( 'layer-options', LayerOptions );
customElements.define ( 'layered-scene', LayeredScene );
customElements.define ( 'scene-layer', SceneLayer );
} ) ();
