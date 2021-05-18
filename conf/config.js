
require('jd-node-env'); // Get Secrets.
const EnvGet = require('jd-getenv');
const CONFIG = {
    PORT : EnvGet.int("NODE_PORT", 8100),
    SMTP : {
        SERVER : EnvGet.string("SMTP_SERVER"),
        PORT : EnvGet.string("SMTP_PORT",465),
        DEFAULT_RECIPIENT : EnvGet.string("DEFAULT_RECIPIENT"),
        USER_TITLE : EnvGet.string("SMTP_USER_TITLE"),
        USER_EMAIL : EnvGet.string("SMTP_USER_EMAIL"),
        USER_LOGIN : EnvGet.string("SMTP_USER_LOGIN"),
        USER_PWD : EnvGet.string("SMTP_USER_PWD"),
        MAX_SIMULTANEAOUS : EnvGet.positiveInt("MAX_SIMULTANEAOUS",2)
    },
    AUTH : {
        KC_USERINFO_EP : EnvGet.string("KC_USERINFO_EP"),
        SCOPE : EnvGet.string("KC_SCOPE", "rwsmailer"),
    }
};
// FREEZE Config.
Object.values(CONFIG).forEach(v => {if (typeof v === "object") { Object.freeze(v)}})

module.exports = CONFIG;