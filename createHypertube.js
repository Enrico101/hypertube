var mysql = require('mysql');
var mkdir = require('mkdirp');
var path = require('path');

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root444@',
    //password: 'Radnic444',
    //socketPath: '/goinfre/enradcli/Desktop/MAMP/mysql/tmp/mysql.sock',
    });

db.connect((err) => {
    if (err)
    console.log(err);
});

var dir_1 = path.join(__dirname, '/Subtitles');
var dir_2 = path.join(__dirname, '/uploads');
var dir_3 = path.join(__dirname, '/series');
var dir_4 = path.join(__dirname, './movies');

mkdir(dir_1).then(made =>
    console.log(`made directories, starting with ${made}`));
mkdir(dir_2).then(made =>
    console.log(`made directories, starting with ${made}`));
mkdir(dir_3).then(made =>
    console.log(`made directories, starting with ${made}`));
mkdir(dir_4).then(made =>
    console.log(`made directories, starting with ${made}`));

db.query("CREATE DATABASE IF NOT EXISTS  hypertube ", (err, succ) => {
    if (err)
        console.log(err);
    else
    {
        db.query("USE hypertube;", (err, succ) => {
            db.query("CREATE TABLE users (username varchar(255), firstname varchar(255), lastname varchar(255), password varchar(1000), email varchar(255), profile_picture varchar(255), signup_type varchar(255))", (err_02, succ_02) => {
                if (err_02)
                    console.log(err_02);
                else
                {
                    db.query("CREATE TABLE movies (movieName varchar(255), path varchar(1000), fullSize BIGINT, downloadPercentage BIGINT, magnet varchar(2000), torrentName varchar(1500), lastedWatched varchar(1500))", (err_03, succ_03) => {
                        if (err_03)
                            console.log(err_03);
                        else
                        {
                            db.query("CREATE TABLE series (seriesName varchar (255), path varchar(1000), fullSize BIGINT, downloadPercentage BIGINT, magnet varchar(2000), torrentName varchar(1500), lastedWatched varchar(1500))", (err_03, succ_03) => {
                                if (err_03)
                                    console.log(err_03);
                                else
                                {
                                    db.query("CREATE TABLE movieViews (username varchar(255), movieWatched varchar(1500))", (err_21, succ_21) => {
                                        if (err_21)
                                            console.log(err_21)
                                        else
                                        {
                                            db.query("CREATE TABLE seriesViews (username varchar(255), seriesWatched varchar(1500));", (err_31, succ_31) => {
                                                if (err_31)
                                                    console.log(err_31)
                                                else
                                                {
                                                    console.log("Database created");
                                                    process.exit;
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        })
    }
})