
require('jd-node-env');
require('jd-getenv');
const path = require("path");
const express = require("express");
const ERROR = require('./lib/error');
const LOGGER = require('./lib/logger');
const Mailer = require("./services/mailer");
const CFG = require("./conf/config");

//----------------------------------------------
let required_env = [ "SMTP_USER_LOGIN", "SMTP_USER_PWD", "DEFAULT_RECIPIENT","SMTP_USER_TITLE"];
required_env.map( e => {
    if (! process.env[e]) { LOGGER.warn(` Env var ${e} is required`); process.exit()};
});

//----------------------------------------------
const app = express();
app.use( express.json({limit: '15mb'}) );
app.use( express.urlencoded({ extended: true }) );
//----------------------------------------------
app.use('/mail', require("./routes/mail"));
app.use('/api', require("./routes/api"));
app.use( "/",  express.static( path.resolve(__dirname + "/static") ) );
//----------------------------------------------
app.use((req, res, next) => { res.status(404).json({ error : "Invalid path"}); });
//----------------------------------------------
app.use((error, req, res, next) => {
    LOGGER.log(error);
    if (ERROR.isMyAppError(error)) {
        res.status(error.code).json({ error : error.message});
    }
});

//----------------------------------------------
Mailer.init()
    .then(() => {
        app.listen( CFG.PORT, () =>
            LOGGER.log(` ****************************** `),
            LOGGER.log(` !!!  STARTED !!!! node-mailer listening on port ${CFG.PORT}  for user ${process.env.SMTP_USER_EMAIL}!`),
            LOGGER.log(` **********  ENV = ${process.env.NODE_ENV} ************* `),
        );
    })
    .catch(() => {
        process.exit();
    })
