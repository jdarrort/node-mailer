const nodeMailer = require('nodemailer');
const LOGGER = require('../lib/logger');
const ERROR = require('../lib/error');
const CFG = require('../conf/config');

var Mailer = {
    nb_ongoing : 0,
    transporter : nodeMailer.createTransport({
        host: CFG.SMTP.SERVER,
        port: CFG.SMTP.PORT,
        tls: {
            rejectUnauthorized: false,
            ignoreTLS :true
        },
        secure: true,
        auth: {
            user: CFG.SMTP.USER_LOGIN,
            pass: CFG.SMTP.USER_PWD
        }
    }), 
    init : async function () {
        return new Promise((resolve,reject) => {
            this.transporter.verify((error, success)  => {
                if (error) {
                  this.log(error);
                  this.warn("Unable to connect to SMTP server. Exit");
                  return reject();
                }
                this.log(`Connectivity to SMTP server '${CFG.SMTP.SERVER}' successful `);
                return resolve();
            });
        })
    },
    sendMail : async function (in_mail_obj) {
        return new Promise((resolve, reject) => {
            this.nb_ongoing ++ ;
            if (this.nb_ongoing >= CFG.SMTP.MAX_SIMULTANEAOUS) { 
                return reject(ERROR.CustomError("Server busy. Quota // reached", 509) );
            }        
            this.transporter.sendMail(in_mail_obj, (error, info) => {
                this.nb_ongoing -- ;
                if (error) {
                    this.log(error);
                    return reject(ERROR.ServerException("Message non Delivré " + error.message));
                }
                this.log(`Message  ${info.messageId} Sent : ${info.response}`);
                resolve();
            })
        })
    }    
}
LOGGER.register(Mailer, "Mailer");

module.exports = Mailer;

