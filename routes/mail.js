const router = require('express').Router();
const DItf = require('../lib/d4itf');
const LOGGER = require('../lib/logger');
const ERROR = require('../lib/error');
const Mailer = require("../services/mailer");
const CFG = require('../conf/config');

//----------------------------------------------
DItf.registerType('base64', function(inputs, key, rule) {
    inputs[key] = Buffer.from(inputs[key],'base64');
    return true;
})

DItf.registerType('email', function(inputs, key, rule) {
    inputs[key] = inputs[key].trim();
    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(inputs[key]);
});

//----------------------------------------------
DItf.registerRules("Mail","post",
`   subject;      string;  Y
     to;          email;   N
     bcc;         email;   N
     text;        string;  N
     html;        string;  N
     attachments; array;   N`);
DItf.registerRules("Mail","attachment",
     `  filename;   string;   Y
        content;    base64;   Y
        cid;        string;   N`);
//----------------------------------------------
//----------------------------------------------
router.post('/', (req, res, next ) => {
    let inputs  = DItf.buildItfData("Mail","post",req.body);
    if (!inputs.text && ! inputs.html) {
        throw ERROR.InvalidAttr("Texte ou Html obligatoires")
    }
    if (inputs.attachments) {
        inputs.attachments.forEach( (att, i) => {
            inputs.attachments[i] = DItf.buildItfData("Mail","attachment",att);
        })
    }

    let mail = {
        from: `"${CFG.SMTP.USER_TITLE}" <${CFG.SMTP.USER_EMAIL}>`, // sender address
        to: inputs.to || CFG.SMTP.DEFAULT_RECIPIENT,
        bcc: inputs.bcc || null,
        subject: inputs.subject,
        text: inputs.text,
        html: inputs.html || null,
        attachments : inputs.attachments || []
    };
    
    LOGGER.log(`About to send Message to ${mail.to} : ${mail.subject}`);
    Mailer.sendMail(mail)
    .then(()=> res.json({status:"success"}))
    .catch(next);
});

// -----------------------------------------------------------------
module.exports = router;
// -----------------------------------------------------------------
