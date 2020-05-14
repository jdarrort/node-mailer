const nodeMailer = require('nodemailer');
const express = require("express");
const bodyParser = require('body-parser')

let required_env = [ "SMTP_USER_LOGIN", "SMTP_USER_PWD", "DEFAULT_RECIPIENT"];
required_env.map( e => {
    if (! process.env[e]) { console.warn(` Env var ${e} is required`); process.exit()};
})

const MAX_SIMULTANEAOUS = process.env.MAX_SIMULTANEAOUS || 5;
var nb_ongoing = 0;

const app = express();
app.use(bodyParser.json())

let transporter = nodeMailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT || 465,
    tls: {
        rejectUnauthorized: false
    },
    secure: true,
    auth: {
        user: process.env.SMTP_USER_LOGIN,
        pass: process.env.SMTP_USER_PWD
    }
});


app.post('/mail', (req, res) => {
    if (! req.body.subject || ! req.body.text) {
        res.status(400).json( { error:"invalid attributes" } );
        return;
    }

    let mail = {
        from: `"RWS Node Mailer" <${process.env.SMTP_USER_EMAIL}>`, // sender address
        to: req.body.to || process.env.DEFAULT_RECIPIENT,   
        subject: req.body.subject,
        text: req.body.text
    };
    
    if (nb_ongoing >= MAX_SIMULTANEAOUS) { 
        res.status(509).json({ error:"Server busy. Quota // reached"}) ;
        return;
    }
    nb_ongoing ++ ;
    console.log('About to send Message to %s : %s', mail.to, mail.subject);
    transporter.sendMail(mail, (error, info) => {
        nb_ongoing -- ;
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
    res.json({ status:"success" });    
});

app.use((req, res, next) => {
    res.status(404).json({ error : "Invalid path"});
});
app.use((error, req, res, next) => {
    console.log(error);
    res.status(500).json({ error : "server error " + error.message});
});

transporter.verify(function(error, success) {
    if (error) {
      console.log(error);
      console.warn("Unable to connect to SMTP server. Exit");
      process.exit();
    }
    console.log(`Connectivity to SMTP server '${process.env.SMTP_SERVER}' successful `);
    let port = process.env.NODE_PORT ||8100;
    app.listen( port, () =>
      console.log(`node-mailer listening on port ${port}  for user ${process.env.SMTP_USER_EMAIL}!`),
    );
});
