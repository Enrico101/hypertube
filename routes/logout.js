var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");

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

router.get('/', (req, res) => {
    if (req.session.username)
    {
        req.session.destroy();
        res.redirect('/');
    }
    else
        res.redirect('http://localhost:3002/login');
})

module.exports = router;