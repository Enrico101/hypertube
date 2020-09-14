var express = require('express');
var session = require('express-session');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var FortyTwoStrategy = require('passport-42').Strategy;
var validator = require('validator');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var db = require('../database/connection');
var path = require('path');

var secretString = Math.floor((Math.random() * 10000) + 1);

var router = express.Router();

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

router.use(session({
    secret: secretString.toString(),
    resave: false,
    saveUninitialized: false
}));
router.use(bodyParser.urlencoded({
    extended: 'true'
}));

//regular signup
router.get('/', (req, res) => {
    req.session.filename = path.basename(__filename);
    res.render('signup', {err: "", succ: ""});
})

router.post('/', (req, res) => {
    var firstname, lastname, username, email, password, salt_rounds;

    firstname = req.body.firstname;
    lastname = req.body.lastname;
    username = req.body.username;
    email = req.body.email;
    password = req.body.password;
    salt_rounds = 5;
    
    if (validator.isEmpty(firstname) == true || validator.isEmpty(lastname) == true || validator.isEmpty(username) == true ||validator.isEmpty(email) == true || validator.isEmpty(password) == true)
    {
        res.render('signup', {err: "missing information", succ: ""});
    }
    else
    {
        db.query("SELECT * FROM users WHERE username = ? AND signup_type = ?", [username, 'hypertube'], (err, users) => {
            db.query("SELECT * FROM users WHERE email = ? AND signup_type = ?", [email, 'hypertube'], (err, e_result) => {
                if (err)
                {
                    res.send(err);
                }
                else if (users.length > 0)
                {
                    res.render('signup', {err: "username already exists", succ: ""});
                }
                else if (e_result.length > 0)
                {
                    res.render('signup', {err: "email already exists", succ: ""})
                }
                else
                {
                    if (validator.isEmail(email))
                    {
                        if (validator.isAlphanumeric(password))
                        {
                            if (validator.isLength(password, {min: 6, max: 40}) == true)
                            {
                                var salt = bcrypt.genSaltSync(salt_rounds);
                                var hash = bcrypt.hashSync(password, salt);
    
                                db.query("INSERT INTO users (username, firstname, lastname, password, email, signup_type) VALUES (?, ?, ?, ?, ?, ?)", [username, firstname, lastname, hash, email, "hypertube"], (err, succ) => {
                                    if (err)
                                        res.send(err);
                                    else
                                    {
                                        res.render('signup', {err: "", succ: "success on signup"});
                                    }
                                })
                            }
                            else
                            {
                                res.render('signup', {err: "password length is incorrect", succ: ""});
                            }
                        }
                        else
                        {
                            res.render('signup', {err: "password specification not matched", succ: ""});
                        }
                    }
                    else
                    {
                        res.render('signup', {err: "email format is incorrect", succ: ""});
                    }
                }  
            })
        });
    }
})

//facebook signup
router.get('/auth/facebook', passport.authenticate('facebook'));
//42 signup
router.get('/auth/42', passport.authenticate('42'));

module.exports = router;