const {
        app,
        BrowserWindow,
    } = require ( 'electron' ),
    path = require ( 'path' ),
    fsp = require ( 'fs/promises' );

require ( 'electron-reload' )( __dirname, {
    electron: path.join ( __dirname, 'node_modules', '.bin', 'electron' )
} );

function buildUI () {
    let win = new BrowserWindow (
        {
            width: 1920,
            height: 1200,
            center: true,
            useContentSize: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                devTools: true
            }
        }
    );

    // TODO: this is in dev mode, package without whitespace
    fsp.readFile ( path.join ( __dirname, 'editor-test.html' ), 'utf8' ).then ( html => {
        fsp.writeFile ( path.join ( __dirname, 'editor-test.temp.html' ), html.replace ( /\n\s*/g, '' ), 'utf8' ).then ( err => {
            win.loadFile ( path.join ( __dirname, 'editor-test.temp.html' ) );
        } );
    } );
}

app.on ('ready', buildUI );

// Quit when all windows are closed.
app.on ( 'window-all-closed', function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if ( process.platform !== 'darwin' ) {
        app.quit ();
    }
} );

app.on ( 'activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    buildUI ();
} );
