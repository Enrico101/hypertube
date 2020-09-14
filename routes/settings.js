var express = require('express');
var session = require('express-session');
var db = require('../database/connection');
var validator = require('validator');
var bodyParser = require('body-parser');
var multer = require('multer');
var imageUpload = require('./image');
var path = require('path');

var router = express.Router();

//image uploads
var imageName = null;
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        console.log(file);
        imageName = Date.now() + path.extname(file.originalname);
        cb(null, imageName);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const upload = multer({ storage: storage, fileFilter: fileFilter });

var secretString = Math.floor((Math.random() * 10000) + 1);
router.use(session({
    secret: secretString.toString(),
    resave: true,
    saveUninitialized: true
}));
router.use(bodyParser.urlencoded({
    extended: 'true'
}));

router.post('/email', (req, res) => {
    if (req.session.username)
    {
        var email = req.body.email;

        console.log("email: "+email);
        if (email != undefined)
        {
            console.log("Im here part 1");
            if (validator.isEmpty(email))
            {
                console.log("Im here part 2");
                //send out notification that no email wa entered.
                res.render("home", {results: "false"})
            }
            else if (validator.isEmail(email))
            {
                console.log("session: "+req.session.username);
                //send out success notification
                db.query("UPDATE users SET email = ? WHERE username = ?", [email, req.session.username], (err, succ) => {
                    if (err)
                    {
                        console.log("Im here part 3");
                        res.send(err);
                    }
                    else
                    {
                        console.log("Successfully chaneged in email.");
                        res.render("home", {results: "true"})
                    }
                })
            }
            else
            {
                //send out notifictaion that email format is incorrect
                console.log("Im here part 4");
                res.render("home", {results: "false"});
            }
        }
        else
        {
            console.log("Im here part 5");
            res.render("home", {results: "false"});
        }
    }
    else
        res.redirect('http://localhost:3002/login');
})

router.post('/profile_pic', upload.single('image'), (req, res) => {
    if (req.session.username)
    {
        if (imageName != null)
        {
            var imagePath = imageName; 
            db.query("UPDATE users SET profile_picture = ? WHERE username = ?", [imagePath, req.session.username], (err, succ) => {
                if (err)
                    res.send(err);
                else
                {
                    console.log("Success upload");
                    res.render('home', {results: "upload complete"})
                }
            })
        }
    }
    else
        res.redirect('http://localhost:3002/login');
})

router.post('/username', (req, res) => {
    if (req.session.username)
    {
        var username = req.body.username;

        console.log("username: "+username);
        if (username != undefined)
        {
            console.log("Im here part 1");
            if (validator.isEmpty(username))
            {
                console.log("Im here part 2");
                //send out notification that no email wa entered.
                res.render("home", {results: "username_false"})
            }
            else
            {
                console.log("session: "+req.session.username);
                //send out success notification
                db.query("UPDATE users SET username = ? WHERE username = ?", [username, req.session.username], (err, succ) => {
                    if (err)
                    {
                        console.log("Im here part 3");
                        res.send(err);
                    }
                    else
                    {
                        req.session.username = username;
                        console.log("Successfully chaneged username.");
                        res.render("home", {results: "username_true"})
                    }
                })
            }
        }
    }
    else
        res.redirect('http://localhost:3002/login');
})

module.exports = router;