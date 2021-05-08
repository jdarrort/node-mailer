
const LOGGER = {
    log : function(txt, mod='') {console.log(`${new Date().toISOString()}-LOG-[${mod}] ${txt} `)},
    warn : function(txt, mod='') {console.warn(`${new Date().toISOString()}-WAR-[${mod}] ${txt} `)},
    err : function(txt, mod='') {console.error(`${new Date().toISOString()}-ERR-[${mod}] ${txt} `)},
    dbg : function(txt, mod='') { if (process.env?.NODE_ENV != 'PROD') {console.debug(`${new Date().toISOString()}-DBG-[${mod}] ${txt} `)}},
    register  : function(t, name) {
        t.log = function(txt) { LOGGER.log(txt, name)};
        t.warn = function(txt) { LOGGER.warn(txt, name)};
        t.err = function(txt) { LOGGER.err(txt, name)};
        t.dbg = function(txt) { LOGGER.dbg(txt, name)};
    }
}

module.exports = LOGGER;