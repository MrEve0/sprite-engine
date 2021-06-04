const {
        app,
        BrowserWindow,
    } = require ( 'electron' ),
    path = require ( 'path' );

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

    win.loadFile ( path.join ( __dirname, 'src/html/main.html' ) );
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
