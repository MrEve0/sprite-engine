( () => {

const   path = require ( 'path' ),
        tabItemTemplate = document.createElement ( 'template' ),
        tabViewTemplate = document.createElement ( 'template' ),
        { guid, guids } = require ( '../src/shared/util.js' );

tabItemTemplate.innerHTML = require ( '../src/html/tab-item.html' ).replace ( /\n\s*/g, '' );
tabViewTemplate.innerHTML = require ( '../src/html/tab-view.html' ).replace ( /\n\s*/g, '' );

class TabItem extends HTMLElement {

    #shadow = null;
    #offset = null;
    #name = null;
    #close = null;
    #updating = false;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( tabItemTemplate.content.cloneNode ( true ) );
        this.#offset = this.#shadow.getElementById ( 'offset' );
        this.#name = this.#shadow.getElementById ( 'name' );
        this.#close = this.#shadow.getElementById ( 'close' );

        this.#close.addEventListener ( 'click', event => {
            let target = document.getElementById ( this.for );
            if ( target && target.parentElement === this.parentElement ) {
                if ( target.dispatchEvent ( new Event ( 'close' ) ) ) {
                    target.remove ();
                    this.remove ();
                }
            }
        } );
    }

    static get observedAttributes () { return [ 'for', 'name', 'offsetx', 'offsety' ]; }

    get for () {
        return this.getAttribute ( 'for' );
    }

    set for ( val ) {
        let target = document.getElementById ( val );
        if ( target && target.parentElement === this.parentElement ) {
            this.setAttribute ( 'for', val );
            this.title = target.name || '';
        } else if ( !val ) {
            this.removeAttribute ( 'for' );
        }
    }

    get name () {
        return this.getAttribute ( 'name' );
    }

    set name ( val ) {
        if ( val ) {
            this.setAttribute ( 'name', val );
        } else {
            this.removeAttribute ( 'name' );
        }
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

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( !this.#updating ) {
            if ( name === 'for' ) {
                let target = document.getElementById ( newVal );
                if ( target ) {
                    if ( target.parentElement === this.parentElement ) {
                        this.name = target.name;
                    } else {
                        let oldTab = document.getElementById ( oldVal );
                        if ( oldTab && oldTab.parentElement === this.parentElement ) {
                            this.#updating = true;
                            this.setAttribute ( 'for', oldVal );
                            this.#updating = false;
                        } else {
                            this.#updating = true;
                            this.removeAttribute ( 'for' );
                            this.removeAttribute ( 'name' );
                            this.#updating = false;
                        }
                    }
                } else if ( !newVal ) {
                    this.removeAttribute ( 'active' );
                }
            } else if ( name === 'name' ) {
                this.#name.textContent = newVal || '';
            } else if ( name === 'offsetx' ) {
                newVal = Number ( newVal ) || 0;
                this.#offset.style.left = newVal ? newVal + 'px' : '';
            } else if ( name === 'offsety' ) {
                newVal = Number ( newVal ) || 0;
                this.#offset.style.top = newVal ? newVal + 'px' : '';
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
    }
}

class TabView extends HTMLElement {

    #shadow = null;
    #tabs = null;
    #slot = null;
    #slotted = null;
    #tabbed = null;
    #updating = false;
    #dragging = null;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( tabViewTemplate.content.cloneNode ( true ) );
        this.#tabs = this.#shadow.getElementById ( 'tabs' );
        this.#slot = this.#shadow.getElementById ( 'slot' );
        this.#slotted = new Map ();
        this.#tabbed = new Map ();

        this.#slot.addEventListener ( 'slotchange', event => {
            for ( let assigned of this.#slot.assignedElements () ) {
                if ( !this.#slotted.has ( assigned ) ) {
                    let tab = document.createElement ( 'tab-item' );
                    tab.for = assigned.id;
                    tab.name = assigned.name;
                    this.#slotted.set ( assigned, tab );
                    this.#tabbed.set ( tab, assigned );
                    this.#tabs.append ( tab );
                    if ( assigned.id === this.active ) {
                        assigned.classList.add ( 'active' );
                        tab.classList.add ( 'active' );
                    } else {
                        assigned.classList.remove ( 'active' );
                    }
                }
            }

            // let active = document.getElementById ( this.active );
            // console.log ( active, active.parentElement, this );
            // if ( active && active.parentElement === this ) {
            //     active.classList.add ( 'active' );
            //     let tab = this.#slotted.get ( active );
            //     if ( tab ) {
            //         tab.classList.add ( 'active' );
            //     }
            // } else {
            //     this.active = null;
            // }
        } );

        this.#tabs.addEventListener ( 'pointerdown', downthis => {
            if ( downthis.target.tagName === 'TAB-ITEM' ) {
                let target = downthis.target;
                if ( downthis.pointerType === 'mouse' && downthis.button === 1 || downthis.isPrimary ) {
                    const   onmovewin = movewin => {
                                if ( movewin.pointerId === downthis.pointerId ) {
                                    if ( !this.#dragging ) {
                                        this.#dragging = target;
                                        this.#dragging.classList.add ( 'dragging' );
                                        downthis.preventDefault ();
                                    }
                                    this.#dragging.offsetx += movewin.movementX;

                                    let list = document.elementsFromPoint ( movewin.clientX, movewin.clientY );
                                    for ( let over of list ) {
                                        if ( over !== this.#dragging && over.parentElement === this ) {
                                            let order = over.compareDocumentPosition ( this.#dragging );
                                            // DOCUMENT_POSITION_PRECEDING : 2
                                            if ( order === 2 ) {
                                                console.log ( 'reinserting before...' );
                                                let rect = over.getBoundingClientRect ();
                                                this.insertBefore ( this.#dragging, over );
                                                this.#dragging.offsetx += rect.width;
                                            // DOCUMENT_POSITION_FOLLOWING : 4
                                            } else if ( order === 4 ) {
                                                console.log ( 'reinserting after...' );
                                                let rect = over.getBoundingClientRect ();
                                                this.insertBefore ( this.#dragging, over.nextSibling );
                                                this.#dragging.offsetx -= rect.width;
                                            }

                                            break;
                                        }
                                    }
                                }
                            },
                            onupwin = upwin => {
                                if ( this.#dragging ) {
                                    this.#dragging.classList.remove ( 'dragging' );
                                    this.#dragging.offsetx = 0;
                                    this.#dragging = null;
                                }
                                window.removeEventListener ( 'pointermove', onmovewin );
                            },
                            // onupthis = upthis => {
                            //     if ( upthis.button === 2 ) {
                            //         let rect = this.getBoundingClientRect ();
                            //         this.#menu.style.top = ( upthis.clientY - rect.top ) + 'px';
                            //         this.#menu.style.left = ( upthis.clientX - rect.left ) + 'px';
                            //         this.#menu.show ( upthis );
                            //     }
                            // },
                            once = { once: true };
                    window.addEventListener ( 'pointermove', onmovewin );
                    window.addEventListener ( 'pointerup', onupwin, once );
                }
            }
        } );

        this.#tabs.addEventListener ( 'click', event => {
            if ( event.target.parentElement === this.#tabs ) {
                this.active = event.target.id;
            }
        } );

        this.addEventListener ( 'keydown', event => {
            if ( event.ctrlKey && event.key.toLowerCase () === 's' ) {
                let active = document.getElementById ( this.active );
                if ( active && active.parentElement === this ) {
                    active.dispatchEvent ( new Event ( 'save' ) );
                }
            }
        } )
    }

    static get observedAttributes () { return [ 'active' ]; }

    get active () {
        return this.getAttribute ( 'active' );
    }

    set active ( val ) {
        this.setAttribute ( 'active', val );
    }

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( !this.#updating ) {
            if ( name === 'active' ) {
                let target = document.getElementById ( newVal );
                if ( target ) {
                    if ( target.parentElement === this ) {
                        if ( oldVal ) {
                            let oldSlotted = document.getElementById ( oldVal );
                            if ( oldSlotted ) oldTab.classList.remove ( 'active' );
                            let tab = this.#slotted.get ( oldSlotted );
                            if ( tab ) {
                                tab.classList.remove ( 'active' );
                            }
                        }
                        let newSlotted = document.getElementById ( newVal );
                        if ( newSlotted ) newTab.classList.add ( 'active' );
                        let tab = this.#slotted.get ( newSlotted );
                        if ( tab ) {
                            tab.classList.add ( 'active' );
                        }
                    } else {
                        let oldTab = document.getElementById ( oldVal );
                        if ( oldTab && oldTab.parentElement === this ) {
                            this.#updating = true;
                            this.setAttribute ( 'active', oldVal );
                            this.#updating = false;
                        } else {
                            this.#updating = true;
                            this.removeAttribute ( 'active' );
                            this.#updating = false;
                        }
                    }
                } else if ( !newVal ) {
                    this.removeAttribute ( 'active' );
                }
            }
        }
    }

    connectedCallback () {
        this.tabIndex = 0;

        if ( this.active ) {
            let active = document.getElementById ( this.active );
            if ( active && active.parentElement === this ) {
                this.#slotted
            }
        }
    }
}

customElements.define ( 'tab-item', TabItem );
customElements.define ( 'tab-view', TabView );

} ) ();
