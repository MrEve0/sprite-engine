require ( './files.js' );

const fileOptions = {
    "New File": { "ctrl-n": event => {} },
    "New Folder": { "ctrl-shift-f": event => {} },
    "sep-0": null,
    "Rename": { "ctrl-shift-r": event => {} },
    "Duplicate": { "ctrl-d": event => {} },
    "Delete": { "ctrl-delete": event => {} },
    "Copy": { "ctrl-c": event => {} },
    "Cut": { "ctrl-x": event => {} },
    "Paste": { "ctrl-v": event => {} },
    "sep-1": null,
    "Copy Full Path": { "ctrl-shift-c": event => {} }
};
