var express = require('express');
var index = require('./routes/index');
var signup = require('./routes/signup');
var home = require('./routes/home');
var login = require('./routes/login');
var db = require('./database/connection');
var session = require('express-session');
var bodyParser = require('body-parser');
var succ = require('./routes/oauth');
var password_reset = require('./routes/passwordReset');
var logout = require('./routes/logout');
var jlocations = require('./routes/javacriptLocations');
var search = require('./routes/search');
var api_key = require('./routes/apiKey');
var settings = require('./routes/settings');
var imageFetcher = require('./routes/imageFetcher');
var unirest = require('unirest');
const magnet = require('magnet-uri');
const TorrentSearchApi = require('torrent-search-api');
const TorrentIndexer = require("torrent-indexer");
var torrentStream = require('torrent-stream');
var Torrent = require('torrent-xiv');
var path = require('path');
const { Stream } = require('stream');
var api = require("qbittorrent-api");
var fs = require('fs');
var pump = require('pump');
var util = require('util');
var app = express();
const torrentIndexer = new TorrentIndexer();

app.set('view engine', 'ejs');

app.use(index);
app.use('/signup', signup);
app.use('/home', home);
app.use('/login', login);
app.use('/succ', succ);
app.use('/password_reset', password_reset);
app.use('/logout', logout);
app.use('/javacript_DOM', jlocations)
app.use('/search', search);
app.use('/settings', settings);
app.use('/uploads', imageFetcher);

var secretString = Math.floor((Math.random() * 10000) + 1);
app.use(session({
    secret: secretString.toString(),
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({
    extended: 'true'
}));

//Database connection.
db.connect((err, succ) => {
    if (err)
    {
        console.log(err);
    }
    else
    {
        console.log("Connected to database");
    }
});

//Check on torrents that arent watched.

setInterval(function () {
    let ts = Date.now();

    let date_ob = new Date(ts);
    let day = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    // prints date & time in YYYY-MM-DD format
    var dateCurrent = day+"/"+month+"/"+year;
    db.query("SELECT * FROM movies", (err, movies) => {
        if (err)
            console.log(err)
        else
        {
            db.query("SELECT * FROM series", (err_2, series) => {
                if (err_2)
                    console.log(err_2);
                else
                {
                    //Loop through movies first.
                    let x  = 0;
                    while (movies[x])
                    {
                        date_2 = movies[x].lastedWatched;
                        var date1 = new Date(dateCurrent); 
                        var date2 = new Date(date_2); 
                        var Difference_In_Time = date2.getTime() - date1.getTime(); 
                        var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

                        if (Difference_In_Days > 30)
                        {
                            db.query("DELETE FROM movies WHERE movieName = ?", [movies[x].movieName], (err_10, succ_10) => {
                                if (err_10)
                                    console.log(err_10);
                            })
                        }
                        else
                        {
                            console.log("Nothing in this row of movies");
                        }
                        x++;
                    }
                    //Loop through movies first.
                    let y  = 0;
                    while (series[y])
                    {
                        date_2 = series[y].lastedWatched;
                        var date1 = new Date(dateCurrent); 
                        var date2 = new Date(date_2); 
                        var Difference_In_Time = date2.getTime() - date1.getTime(); 
                        var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

                        if (Difference_In_Days > 30)
                        {
                            db.query("DELETE FROM series WHERE seriesName = ?", [series[y].seriesName], (err_10, succ_10) => {
                                if (err_10)
                                    console.log(err_10);
                            })
                        }
                        else
                        {
                            console.log("Nothing in this row of series");
                        }
                        y++;
                    }
                }
            })    
        }
    })
}, 8.64e+7);
//testing routes

function streamFile(res, file, start, end, fileName)
{
    let stream = file.createReadStream({
        start: start,
        end: end
    })
    pump(stream, res);

}

app.listen(3002, (err) => {
    if (err)
        console.log(err);
    else
        console.log("Listening on port 3002");
})