var express = require('express');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var db = require('../database/connection');
var validator = require('validator');
var bodyParser = require('body-parser');
var db = require('../database/connection');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var FortyTwoStrategy = require('passport-42').Strategy;
var path = require('path');

var router = express.Router();

var secretString = Math.floor((Math.random() * 10000) + 1);
router.use(session({
    secret: secretString.toString(),
    resave: true,
    saveUninitialized: true
}));
router.use(bodyParser.urlencoded({
    extended: 'true'
}));
router.use(passport.initialize());

passport.use(new Strategy({
    clientID: "1944735342328527",
    clientSecret: "b9a5b0197e344351c8c0599aabc89186",
    callbackURL: "http://localhost:3002/succ/auth/facebook/callback"/*,profileFields: ['id', 'displayName', 'photos', 'email']*/}, (accessToken, refreshToken, profile, cb) => {
            return cb(null, profile);
    }))
passport.use(new FortyTwoStrategy({
    clientID: "7c7eac94d897f44a090d6f009524ed280cf515e7fb7ca54588e1ae1b63e99133",
    clientSecret: "66fcefdaa575b545fab04a67bc3b744359e0a1f44943b70c5deff21264677be3",
    callbackURL: "http://localhost:3002/succ/auth/42/callback"}, (accessToken, refreshToken, profile, cb) => {
          return cb(null, profile);
      }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
      
passport.deserializeUser(function(id, done) {
        done(err, user);
});

router.get('/', (req, res) => {
    req.session.filename = path.basename(__filename);
    res.render('login', {err: ""});
});

//Hypertube login
router.post('/', (req, res) => {
    var userName, password;

    userName = req.body.username;
    password = req.body.password;

    if (validator.isEmpty(userName) == true || validator.isEmpty(password) == true)
    {
        res.render('login', {err: "a field is emtpy", succ: ""});
    }
    else
    {
        db.query("SELECT * FROM users WHERE username = ? AND signup_type = ?", [userName, 'hypertube'], (err, user) => {
            if (err)
                res.render(err);
            else if (user.length > 0)
            {
                if (userName == user[0].username && bcrypt.compareSync(password, user[0].password))
                {
                    req.session.username = userName;
                    req.session.provider = 'hypertube';
                    res.redirect('/home');
                }
                else
                {
                    console.log('Incorrect password');
                    res.render('login', {err: "password or username is incorrect", succ: ""});
                }
            }
            else
            {
                console.log('User does not exist');
                res.render('login', {err: "user does not exist", succ: ""});
            }
        })
    }
})

//facebook login
router.get('/auth/facebook', passport.authenticate('facebook'));
//42 login
router.get('/auth/42', passport.authenticate('42'));
/*router.get('/auth/42/callback', passport.authenticate('42', { failureRedirect: '/login'}), (req, res) => {
    var firstName, userName, lastName, email, signup_type, password;

    firstName = req.user.name.givenName;
    console.log("firstName_1: "+firstName);
    lastName = req.user.name.familyName;
    userName = req.user.username;
    console.log("userName_1: "+userName);
    email = req.user.emails[0].value;
    signup_type = "42";

    if (firstName == undefined)
        firstName = "none"
    if (lastName == undefined)
        lastName = "none";
    if (userName == undefined)
        userName = "default";
    if (email == undefined)
        email = "none";

    password = '42'+userName;
    db.query("SELECT * FROM users WHERE username = ? AND signup_type = ?", [userName, signup_type], (err, user) => {
        if (err)
            res.send(err);
        else if (user.length > 0)
        {
            if (userName == user[0].username && bcrypt.compareSync(password, user[0].password))
            {
                req.session.username = userName;
                req.session.provider = '42';
                res.redirect('/home');
            }
        }
    });
})*/

module.exports = router;