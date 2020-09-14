var express = require('express');
var session = require('express-session');
var db = require('../database/connection');
const { route } = require('./settings');
var path = require('path');

var router = express.Router();

var secretString = Math.floor((Math.random() * 10000) + 1);
router.use(session({
    secret: secretString.toString(),
    resave: false,
    saveUninitialized: false
}));

router.get('/:imageId', (req, res) => {
    res.sendFile(req.params.imageId, { root: path.join(__dirname, '../uploads') });
})

module.exports = router;