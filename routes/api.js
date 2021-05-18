const router = require('express').Router();
const AuthCheck = require('./auth');
router.use('/mail', AuthCheck, require('./mail'));

// -----------------------------------------------------------------
module.exports = router;
// -----------------------------------------------------------------
