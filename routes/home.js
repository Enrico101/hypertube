var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var db = require('../database/connection');

var router = express.Router();

var secretString = Math.floor((Math.random() * 10000) + 1);
router.use(session({
    secret: secretString.toString(),
    resave: false,
    saveUninitialized: false
}));
router.use(bodyParser.urlencoded({
    extended: 'true'
}));

router.get('/', (req, res) => {
    if (req.session.username)
    {
        db.query("SELECT * FROM users WHERE username != ?", [req.session.username], (err, results) => {
            if  (err)
                res.send(err);
            else
            {
                res.render('home', {users: results});
            }
        })
    }
    else
        res.redirect('http://localhost:3002/login');
});

module.exports = router;