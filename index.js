
require('jd-node-env');
const nodeMailer = require('nodemailer');
const express = require("express");
const DItf = require('./lib/d4itf');
const LOGGER = require('./lib/logger');

let required_env = [ "SMTP_USER_LOGIN", "SMTP_USER_PWD", "DEFAULT_RECIPIENT"];
required_env.map( e => {
    if (! process.env[e]) { LOGGER.warn(` Env var ${e} is required`); process.exit()};
})

const MAX_SIMULTANEAOUS = process.env.MAX_SIMULTANEAOUS || 5;
var nb_ongoing = 0;

const app = express();
app.use( express.json() );
//----------------------------------------------
let transporter = nodeMailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT || 465,
    tls: {
        rejectUnauthorized: false,
        ignoreTLS :true
    },
    secure: true,
    auth: {
        user: process.env.SMTP_USER_LOGIN,
        pass: process.env.SMTP_USER_PWD
    }
});
//----------------------------------------------
DItf.registerRules("Mail","post",
`   subject;       string;   Y
     to;           string;   N
     bcc;           string;   N
     text;         string;   Y
     attachments;  array;   N`);
DItf.registerRules("Mail","attachment",
     `  name;       string;   Y
        datab64;    string;   Y`);
//----------------------------------------------
app.post('/mail', (req, res) => {
    let inputs  = DItf.buildItfData("Mail","post",req.body);
    if (inputs.attachments) {
        inputs.attachments.forEach( (att, i) => {
            att = DItf.buildItfData("Mail","attachment",att);
            inputs.attachments[i] = {
                filename: att.name,
                content : Buffer.from(att.datab64, 'base64')
            }
        })
    }

    let mail = {
        from: `"Julien Darrort" <${process.env.SMTP_USER_EMAIL}>`, // sender address
        to: inputs.to || process.env.DEFAULT_RECIPIENT,   
        bcc: inputs.bcc || null,
        subject: inputs.subject,
        text: inputs.text,
        attachments : inputs.attachments || []
    };
    
    if (nb_ongoing >= MAX_SIMULTANEAOUS) { 
        res.status(509).json({ error:"Server busy. Quota // reached"}) ;
        return;
    }
    nb_ongoing ++ ;
    LOGGER.log(`About to send Message to ${mail.to} : ${mail.subject}`);
    transporter.sendMail(mail, (error, info) => {
        nb_ongoing -- ;
        if (error) {
            LOGGER.log(error);
            return res.status(500).json({ error : "Message non délivré  : " + error.message});
        }
        LOGGER.log(`Message  ${info.messageId} Sent : ${info.response}`);
        return res.json({ status:"success" });    
    });
});

//----------------------------------------------
app.use((req, res, next) => {
    res.status(404).json({ error : "Invalid path"});
});
//----------------------------------------------
app.use((error, req, res, next) => {
    LOGGER.log(error);
    res.status(500).json({ error : "server error " + error.message});
});

//----------------------------------------------
transporter.verify(function(error, success) {
    if (error) {
      LOGGER.log(error);
      LOGGER.warn("Unable to connect to SMTP server. Exit");
      process.exit();
    }
    LOGGER.log(`Connectivity to SMTP server '${process.env.SMTP_SERVER}' successful `);
    let port = process.env.NODE_PORT ||8100;
    app.listen( port, () =>
      LOGGER.log(`node-mailer listening on port ${port}  for user ${process.env.SMTP_USER_EMAIL}!`),
    );
});
