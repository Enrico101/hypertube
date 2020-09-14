var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var FortyTwoStrategy = require('passport-42').Strategy;
var path = require('path');
var db = require('../database/connection');
var bcrypt = require('bcrypt-nodejs');
const { NONAME } = require('dns');
var validator = require('validator');

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

router.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/login'}), (req, res) => {
    if (req.session.filename == "login.js")
    {
        if (req.user)
        {
            var firstName, userName, lastName, email, signup_type, password;

            firstName = req.user.name.givenName;
            console.log("firstName_1: "+firstName);
            lastName = req.user.name.familyName;
            userName = req.user.displayName;
            console.log("userName_1: "+userName);
            if (req.user.emails == undefined)
                email = "none";
            else
                email = req.user.emails[0].value;
            signup_type = "facebook";
        
            if (firstName == undefined)
                firstName = "none"
            if (lastName == undefined)
                lastName = "none";
            if (userName == undefined)
                userName = "default";
        
            password = 'facebook'+userName;
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
                else
                {
                    res.render('login', {err: "user does not exist"});
                }
            });
        }
        else
        {
            res.render('login', {err: "user does not exist"});
        }
    }
    else if (req.session.filename == "signup.js")
    {
        // Successful authentication, redirect home.
        var firstName, lastName, userName, email, signup_type;

        firstName = req.user.name.givenName;
        lastName = req.user.name.familyName;
        userName = req.user.displayName;
        signup_type = "facebook";

        if (req.user.email)
            email = req.user.email;
        else
            email = undefined;

        if (firstName == undefined)
            firstName = "none"
        if (lastName == undefined)
            lastName = "none";
        if (userName == undefined)
            userName = "default";
        if (email == undefined)
            email = "none";
        
        db.query("SELECT * FROM users WHERE username = ? AND signup_type = ?", [userName, signup_type], (err, user) => {
            db.query("SELECT * FROM users WHERE email = ? AND signup_type = ?", [email, signup_type], (err, e_result) => {
                if (err)
                    res.send(err)
                else if (user.length > 0)
                {
                    res.render('signup', {err: "username already exists", succ: ""});
                }
                else if (e_result.length > 0)
                {
                    res.render('signup', {err: "email already exists", succ: ""});
                }
                else
                {
                    var salt_rounds = 5;
                    var salt = bcrypt.genSaltSync(salt_rounds);
                    var hash = bcrypt.hashSync(signup_type+userName, salt);

                    db.query("INSERT INTO users (username, firstname, lastname, password, email, signup_type) VALUES (?, ?, ?, ?, ?, ?)", [userName, firstName, lastName, hash, email, signup_type], (err, succ) => {
                        if (err)
                            res.send(err);
                        else
                        {
                            res.render('signup', {err: "", succ: "success on signup"});
                        }
                    })
                }
            })
        })
    }
})

router.get('/auth/42/callback', passport.authenticate('42', { failureRedirect: '/login'}), (req, res) => {
    if (req.session.filename == "login.js")
    {
        if (req.user)
        {
            var firstName, userName, lastName, email, signup_type, password;

            firstName = req.user.name.givenName;
            console.log("firstName_1: "+firstName);
            lastName = req.user.name.familyName;
            userName = req.user.username;
            console.log("userName_1: "+userName);
            if (req.user.emails == undefined)
                email = "none";
            else
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
                else
                {
                    res.render("login", {err: "user does not exist"})
                }
            });
        }
        else
        {
            res.render("login", {err: "user does not exist"})
        }
    }
    else if (req.session.filename == "signup.js")
    {
        var firstName, userName, lastName, email, signup_type;

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

        console.log("firstName_2: "+firstName);
        console.log("userName_2: "+userName);
        db.query("SELECT * FROM users WHERE username = ? AND signup_type = ?", [userName, signup_type], (err, user) => {
            console.log("firstName_3: "+firstName);
            console.log("userName_3: "+userName);
            db.query("SELECT * FROM users WHERE email = ? AND signup_type = ?", [email, signup_type], (err, e_result) => {
                if (err)
                    res.send(err);
                else if (user.length > 0)
                {
                    res.render('signup', {err: "username already exists", succ: ""});
                }
                else if (e_result.length > 0)
                {
                    res.render('signup', {err: "email already exists", succ: ""});
                }
                else
                {
                    var salt_rounds = 5;
                    var salt = bcrypt.genSaltSync(salt_rounds);
                    var hash = bcrypt.hashSync('42'+userName, salt);

                    console.log("firstName_4: "+firstName);
                    console.log("userName_4: "+userName);

                    db.query("INSERT INTO users (username, firstname, lastname, password, email, signup_type) VALUES (?, ?, ?, ?, ?, ?)", [userName, firstName, lastName, hash, email, "42"], (err, succ) => {
                        if (err)
                            res.send(err);
                        else
                        {
                            res.render('signup', {err: "", succ: "success on signup"});
                        }
                    })
                }
            });
        });
    }
})

module.exports = router;