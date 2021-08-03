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
        if ( val ) {
            this.setAttribute ( 'for', val );
        } else {
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

    get offsetRect () {
        return this.#offset.getBoundingClientRect ();
    }

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( !this.#updating ) {
            if ( name === 'for' ) {
                let target = document.getElementById ( newVal );
                if ( target ) {
                    this.name = target.name;
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
    #content = null;
    #slotted = null;
    #tabbed = null;
    #updating = false;
    #dragging = null;

    constructor () {
        super ();

        this.#shadow = this.attachShadow ( { mode: 'closed' } );
        this.#shadow.append ( tabViewTemplate.content.cloneNode ( true ) );
        this.#tabs = this.#shadow.getElementById ( 'tabs' );
        this.#content = this.#shadow.getElementById ( 'content' );
        this.#slotted = new Map ();
        this.#tabbed = new Map ();

        this.#content.addEventListener ( 'slotchange', event => {
            for ( let assigned of this.#content.assignedElements () ) {
                if ( !this.#slotted.has ( assigned ) ) {
                    let tab = document.createElement ( 'tab-item' );
                    tab.for = assigned.id;
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

                                    let rect = this.#tabs.getBoundingClientRect ();

                                    if ( movewin.clientX >= rect.left && movewin.clientX < rect.right ) {
                                        let left = this.#dragging.previousElementSibling,
                                            left_rect,
                                            right = this.#dragging.nextElementSibling,
                                            right_rect;

                                        if ( left && movewin.clientX < ( left_rect = left.getBoundingClientRect () ).right ) {
                                            this.#tabs.insertBefore ( this.#dragging, left );
                                            this.#dragging.offsetx += left_rect.width;
                                        } else if ( right && movewin.clientX >= ( right_rect = right.getBoundingClientRect () ).left ) {
                                            this.#tabs.insertBefore ( this.#dragging, right.nextSibling );
                                            this.#dragging.offsetx -= right_rect.width;
                                        }

                                        this.#dragging.offsetx += movewin.movementX;
                                    }

                                    let drag_rect = this.#dragging.offsetRect;

                                    if ( drag_rect.left < rect.left ) {
                                        this.#dragging.offsetx += rect.left - drag_rect.left;
                                    } else if ( drag_rect.right > rect.right ) {
                                        this.#dragging.offsetx += rect.right - drag_rect.right;
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
                this.active = event.target.for;
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
        if ( val ) {
            this.setAttribute ( 'active', val );
        } else {
            this.removeAttribute ( 'active' );
        }
    }

    attributeChangedCallback ( name, oldVal, newVal ) {
        if ( !this.#updating ) {
            if ( name === 'active' ) {
                let target = document.getElementById ( newVal );
                if ( target ) {
                    if ( target.parentElement === this ) {
                        if ( oldVal ) {
                            let oldSlotted = document.getElementById ( oldVal );
                            if ( oldSlotted ) oldSlotted.classList.remove ( 'active' );
                            let oldTab = this.#slotted.get ( oldSlotted );
                            if ( oldTab ) oldTab.classList.remove ( 'active' );
                        }
                        let newSlotted = document.getElementById ( newVal );
                        if ( newSlotted ) newSlotted.classList.add ( 'active' );
                        let newTab = this.#slotted.get ( newSlotted );
                        if ( newTab ) newTab.classList.add ( 'active' );
                    }
                } else if ( !newVal ) {
                    this.removeAttribute ( 'active' );
                }
            }
        }
    }

    connectedCallback () {
        this.tabIndex = 0;
    }
}

customElements.define ( 'tab-item', TabItem );
customElements.define ( 'tab-view', TabView );

} ) ();
