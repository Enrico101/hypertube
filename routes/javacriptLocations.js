var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');

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

router.get('/language.js', (req, res) => {
   res.sendFile('language.js', { root: path.join(__dirname, '../javascript_DOM') });
})

module.exports = router;