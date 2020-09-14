var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var unirest = require('unirest');

var secretString = Math.floor((Math.random() * 10000) + 1);
router = express.Router();
router.use(session({
    secret: secretString.toString(),
    resave: false,
    saveUninitialized: false
}));
router.use(bodyParser.urlencoded({
    extended: 'true'
}));

router.get('/', (req, res) => {
    res.render('index');
})

module.exports = router;