var express = require('express');
var session = require('express-session');
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');
var validator = require('validator');
var db = require('../database/connection');
var bcrypt = require('bcrypt-nodejs');
const { query } = require('../database/connection');


var router = express.Router();

router.use(bodyParser.urlencoded({
    extended: 'true'
}));

router.get('/', (req, res) => {
    res.render('passwordReset', {succ: ""});
})

router.post('/', (req, res) => {
    var transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "hypertube444",
            pass: "Radnic444"
        },
        tls: {
            rejectUnauthorized: false
        }
    })

    var mailOptions = {
        from: "hypertube@gmail.com",
        to: req.body.email,
        subject: "click on the link below to reset password:",
        text: "http://localhost:3002/password_reset/valid_email"
    };

    transport.sendMail(mailOptions, (err, succ) => {
        if (err)
            res.send(err);
        else
        {
            console.log("Email was successfully sent to "+req.body.email);
            res.render('passwordReset', {succ: "email was sent"});
        }
    })
})

router.get('/valid_email', (req, res) => {
    res.render('valid_email', {err: "", succ: ""});
})
router.post('/valid_email', (req, res) => {
    var username, oldPassword, newPassword, signup_type;

    username = req.body.username;
    oldPassword = req.body.old_password;
    newPassword = req.body.new_password;
    signup_type = "hypertube";

    if (validator.isEmpty(username) || validator.isEmpty(newPassword) || validator.isEmpty(oldPassword))
    {
        res.render('valid_email', {err: "missing info", succ: ""});
    }
    else
    {
        db.query("SELECT * FROM users WHERE username = ? AND signup_type = ?", [username, signup_type], (err, user) => {
            if (err)
                res.send(err);
            else if (user.length > 0)
            {
                if (bcrypt.compareSync(oldPassword, user[0].password))
                {
                    if (validator.isAlphanumeric(newPassword) && (validator.isLength(newPassword, {min: 6, max: 40}) == true))
                    {
                        var salt_rounds = 5;
                        var salt = bcrypt.genSaltSync(salt_rounds);
                        var hash = bcrypt.hashSync(newPassword, salt);

                        db.query("UPDATE users SET password = ? WHERE username = ? AND signup_type = ?", [hash, username, signup_type], (err, succ) => {
                            if (err)
                                res.send(err);
                            else
                            {
                                res.render('login', {err: "", succ: "successfully changed password"});
                            }
                        })
                    }
                    else
                    {
                        res.render('valid_email', {err: "password format is incorrect", succ: ""});
                    }
                }
                else
                {
                    res.render('valid_email', {err: "passwords did not match", succ: ""});
                }
            }
            else
            {
                res.render("valid_email", {err: "information does not exist", succ: ""});
            }
        })
    }
})

module.exports = router;