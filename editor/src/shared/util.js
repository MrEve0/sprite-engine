let guids = new Set ();

module.exports.guid = function guid () {
    let store = new Uint32Array ( 1 ),
        uuid;
    do {
        uuid = [].map.call ( crypto.getRandomValues ( store ), v => v.toString ( 16 ) ).join ( '' ).padStart ( 8, 0 );
    } while ( document.getElementById ( uuid ) );
    guids.add ( uuid );
    return uuid;
}

module.exports.guids = guids;
