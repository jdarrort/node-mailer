// Validate Bearer Access Tokens against KeyCloak
const atob = require('atob');
const router = require('express').Router();
const ERROR = require('../lib/error');
const LOGGER = require('../lib/logger');
const RestCli = require('jd_rest_cli');
const CFG = require('../conf/config');

const EXPECTED_SCOPE = CFG.AUTH.SCOPE;

router.use((req, res, next) => {
    if (! req.headers.authorization) {
        throw ERROR.NotAuthenticated("Not authenticated");
    }
    // Checking Roles / Scopes in AT (if KO, no need to go any further)
    let raw_at = req.headers.authorization.replace(/^Bearer /, "");
    checkScopeInAccessToken(raw_at);

    // Online Validation of the AT: Call KC USERINFO EP with AT, and check scope
    RestCli.get(CFG.AUTH.KC_USERINFO_EP).headers({authorization : req.headers.authorization}).send()
    .then((reply) => {
        if (reply.statusCode != 200) {
            LOGGER.warn(`Failed to retrieve user info : ${reply.statusCode}`)
            return next(ERROR.NotAuthenticated("Invalid Authorization"));
        }
        LOGGER.log(`Called from ${reply.body.username}`);
        next();
    })
    .catch((e) => {
        LOGGER.warn(`Unable to authentify caller. ${e.code} / ${e.error}`)
        return next(ERROR.NotAuthenticated("Invalid Authorizations"));
    })
})

function checkScopeInAccessToken(in_at) {
    let at ;
    try {
        at = JSON.parse(atob(in_at.split(".")[1]));
    } catch (e) {
        LOGGER.warn("Failed to Parse AT");
        throw ERROR.ServerException("Failed to parse Bearer");
    }
    // Does the user have the role ? 
    if (! at.scope || at.scope.split(" ").indexOf(EXPECTED_SCOPE) == -1 )  {
        throw ERROR.NotAuthorized("Client is not allowed to use this service");
    }
    return true;
}

// -----------------------------------------------------------------
module.exports = router;
// -----------------------------------------------------------------
