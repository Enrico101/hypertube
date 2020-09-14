var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var db = require('../database/connection');
var validator = require('validator');
var unirest = require('unirest');
const TorrentIndexer = require("torrent-indexer");
var Torrent = require('torrent-xiv');
var api_key = require('./apiKey');
var Series = require('../classes/seriesClass');
var fastSort = require('fast-sort');
const { link } = require('./apiKey');
var apiKey_2 = require('./apiKey_2');
const fs = require("fs")
var path = require('path');
var util = require('util');
const { response } = require('express');
var torrentStream = require('torrent-stream');
var TorrentSearchApi = require('torrent-search-api');
var moviesClass = require('../classes/movieClass');
const OS = require('opensubtitles-api');
var srt2vtt = require('srt-to-vtt');
var download = require('download');
var mkdirp = require('mkdirp');
var pump = require('pump');

var router = express.Router();
TorrentSearchApi.enableProvider('ThePirateBay');
const torrentIndexer = new TorrentIndexer();
const OpenSubtitles = new OS({useragent: 'TemporaryUserAgent', username: 'abanvill', password: 'abanvill'});

var secretString = Math.floor((Math.random() * 10000) + 1);
router.use(session({
    secret: secretString.toString(),
    resave: true,
    saveUninitialized: true
}));
router.use(bodyParser.urlencoded({
    extended: 'true'
}));

//Use this variable to notify about the movie updates.
//var notify = null;

//This is for series
var torrentPath = null;
var container = null;
var magnet = null;
var seriesOroiginalName = null;

//This is for movies
var magnetMovie = null;  //keep track of bugs
var movieName = null;
var movieOriginalName = null;
var movieMime = null;

router.get('/movie', (req, res) => {
    if (req.session.username)
    {
        if (req.query.search)
        {
            var movies = [];
            var search = req.query.search;
            var url = "https://api.themoviedb.org/3/search/movie?api_key=" + api_key + "&query=" + search;
            var url_2 = "http://www.omdbapi.com/?apikey="+apiKey_2+"&s="+search+"&type=movie";

            var Request = unirest('GET', url)
            var Request_2 = unirest('GET', url_2);

            Request.end((response) => {
                Request_2.end((response_2) => {
                    var x = 0;
                    var y = 0;

                    if (response)
                    {
                        while (response.body.results[x])
                        {
                            var imageUrl = "https://image.tmdb.org/t/p/w500"+response.body.results[x].poster_path;

                            movies.push(new moviesClass(response.body.results[x].title, imageUrl, response.body.results[x].id, response.body.results[x].release_date, "moviedb"));
                            x++;
                        }
                    }
                    if (response_2)
                    {
                        while (response_2.body.Search[y])
                        {
                            movies.push(new moviesClass(response_2.body.Search[y].Title, response_2.body.Search[y].Poster, response_2.body.Search[y].imdbID, response_2.body.Search[y].Year, "omdb"));
                            y++;
                        }
                    }
                    var count = Math.trunc(movies.length / 5);
                    if ((movies.length % 5) > 0)
                        count++;
                    fastSort(movies).asc(m => m.title);
                    //Check for movies That were watched

                    db.query("SELECT * FROM movieViews WHERE username = ?", [req.session.username, search], (err, succ) => {
                        if (err)
                            console.log(err);
                        else if (succ.length > 0)
                        {
                            var x = 0;
                            var moviesW = [];
                            while (succ[x])
                            {
                                moviesW[x] = succ[x].movieWatched;
                                x++;
                            }
                            res.render('movie', { search_results: movies, row_count: count , popularMovies: "", movieWatched: moviesW});
                        }
                        else
                        {
                            res.render('movie', { search_results: movies, row_count: count , popularMovies: "", movieWatched: ""});
                        }
                    })
                })
            })
        }
        else if (req.query.sortingResults)
        {
            console.log("results: "+req.query.sortingResults);
            var url = "https://api.themoviedb.org/3/movie/popular?api_key="+api_key+"&page=1";

            var popularMovies = unirest('GET', url)
            popularMovies.end((response) => {
                if (response)
                {
                    if (req.query.sortingResults == "name.asc")
                        fastSort(response.body.results).asc(m => m.title);
                    else if (req.query.sortingResults == "name.desc")
                        fastSort(response.body.results).desc(m => m.title);
                    else if (req.query.sortingResults == "popularity.asc")
                        fastSort(response.body.results).desc(m => m.vote_count);
                    else if (req.query.sortingResults == "popularity.desc")
                        fastSort(response.body.results).desc(m => m.vote_count);
                    res.render('movie', { search_results: "", row_count: "", popularMovies: response.body.results});
                }
                else
                    res.send("An error has occured");
            })
        }
        else
        {
            //Get most popular media
            var url = "https://api.themoviedb.org/3/movie/popular?api_key="+api_key+"&page=1";

            var popularMovies = unirest('GET', url)
            popularMovies.end((response) => {
                if (response)
                    res.render('movie', { search_results: "", row_count: "", popularMovies: response.body.results});
                else
                    res.send("An error has occured");
            })
        }
    }
    else
        res.redirect('http://localhost:3002/login');
})

router.post("/movie/video_player", (req, res) => {
    if (req.session.username)
    {
        if (req.body.movieName)
        {
            movieName = req.body.movieName;
            async function search()
            {
                var torrents;
                var torrents = await TorrentSearchApi.search(movieName, 'Video', 20);

                if (torrents != undefined)
                {
                    if (torrents.length > 0)
                    {
                        var x = 0;
                        while (torrents[x])
                        {
                            if (torrents[x].title.search('mp4') > -1 || torrents[x].title.search('mkv') > -1)
                            {   
                                if (torrents[x].title.search('mp4'))
                                    movieMime = "mp4";
                                else
                                    movieMime = "mkv";
                                
                                magnetMovie = torrents[x].magnet;
                                req.session.magnetMovieRem = magnetMovie; //Remeber what the last value was for gloabal variables.
                                break;
                            }
                            x++;
                        }
                    }
                    else
                        res.send("An erro occured");
                }
                else
                    res.send("An error occured");
            }
            search();

            db.query("INSERT INTO movieViews (username, movieWatched) VALUES (?, ?)", [req.session.username, req.body.movieName], (err, succ) => {
                if (err)
                    console.log(err)
                else
                    console.log("Recorded movie");
            })

            if (req.body.provider)
            {
                if (req.body.provider == "moviedb")
                    var url = "https://api.themoviedb.org/3/movie/"+req.body.movieId+"?api_key="+api_key;
                else if (req.body.provider == "omdb")
                    var url = "http://www.omdbapi.com/?apiKey="+apiKey_2+"&i="+req.body.movieId+"&type=movie";

                var Request_1 = unirest('GET', url);
                Request_1.end((response) => {
                    if (response)
                        res.render('movieVideo', {movie_info: response.body, provider: req.body.provider});
                    else
                        res.send("An error occured");
                })
            }
            else
                res.send("An error occured");
        }
    }
    else
        res.redirect('http://localhost:3002/login');
})

router.get("/movies/video", (req, res) => {
    if (req.session.username)
    {
        if (magnetMovie != null)
        {
            if (magnetMovie.search("magnet") > -1)
            {
                var dir;
                var results;
                //check if movie directory exists.
                var dir = path.join(__dirname, '../movies', '/'+movieName);
                var results = fs.existsSync(dir);

                if (results == false && results)
                {
                    //create a directory for the movie if does not exits.
                    mkdirp.sync(dir);

                    db.query("INSERT INTO movies (movieName, path, fullSize, downloadPercentage, magnet, torrentName) VALUES (?, ?, ?, ?, ?, ?)", [movieName, 0, 0, dir, magnetMovie, ""], (err, succ) => {
                        if (err)
                            res.send("An error occured");
                        else
                        {
                            db.query("SELECT * FROM movies WHERE movieName = ?", [movieName], (err, movieInfo) => {
                                if (err)
                                    console.log(err);
                                else
                                {
                                    const engine = torrentStream(magnetMovie, {
                                        connections: 100,   
                                        uploads: 10,         
                                        path: dir, 
                                        verify: true,                       
                                        trackers: [
                                            'udp://tracker.leechers-paradise.org:6969/announce',
                                            'udp://tracker.pirateparty.gr:6969/announce',
                                            'udp://tracker.coppersurfer.tk:6969/announce',
                                            'http://asnet.pw:2710/announce',
                                            'http://tracker.opentrackr.org:1337/announce',
                                            'udp://tracker.opentrackr.org:1337/announce',
                                            'udp://tracker1.xku.tv:6969/announce',
                                            'udp://tracker1.wasabii.com.tw:6969/announce',
                                            'udp://tracker.zer0day.to:1337/announce',
                                            'udp://p4p.arenabg.com:1337/announce',
                                            'http://tracker.internetwarriors.net:1337/announce',
                                            'udp://tracker.internetwarriors.net:1337/announce',
                                            'udp://allesanddro.de:1337/announce',
                                            'udp://9.rarbg.com:2710/announce',
                                            'udp://tracker.dler.org:6969/announce',
                                            'http://mgtracker.org:6969/announce',
                                            'http://tracker.mg64.net:6881/announce',
                                            'http://tracker.devil-torrents.pl:80/announce',
                                            'http://ipv4.tracker.harry.lu:80/announce',
                                            'http://tracker.electro-torrent.pl:80/announce'
                                        ]
                                    });
                                    var fileSize = null;
                                    engine.on('ready', () => {
                                        var x = 0;
                                        //Multiple files can download so we need to find the video by checking for the extension. X should stop on the file once found.
                                        //We dont need to check if the engine instance exists because ready will be ommited.
                                        while(engine.files[x])
                                        {
                                            if (engine.files[x].name.search(".mkv"))
                                            {
                                                var format = "mkv";
                                                break;
                                            }
                                            else if (engine.files[x].name.search(".mp4"))
                                            {
                                                var format = "mp4";
                                                break;
                                            }
                                            x++;
                                        }
                                        var fileName = null;
                                        fileName = engine.files[x].name;
                                        db.query("UPDATE movies SET fullSize = ? WHERE movieName = ?", [engine.files[x].length, movieName], (err) => {
                                            if (err)
                                                res.send("An error occured");
                                        })
                                        db.query("UPDATE movies SET torrentName = ? WHERE movieName = ?", [engine.files[x].name, movieName], (err_12, succ_12) => {
                                            if (err_12)
                                            res.send("An error occured");
                                        })
                                        //Updating the date info
                                        let ts = Date.now();

                                        let date_ob = new Date(ts);
                                        let day = date_ob.getDate();
                                        let month = date_ob.getMonth() + 1;
                                        let year = date_ob.getFullYear();
                                        
                                        // prints date & time in YYYY-MM-DD format
                                        var date = day+"/"+month+"/"+year;
                                        db.query("UPDATE movies SET lastedWatched = ? WHERE movieName = ?", [date, movieName], (err_09, succ_09) => {
                                            if (err_09)
                                                res.send("An error occured");
                                            else
                                                console.log("Inserted date");
                                        })
                                        //Just make sure that we found the correct file by checking the extension.
                                        if (fileName.search(".mkv") > -1 || fileName.search(".mp4") > -1)
                                        {
                                            engine.files[x].select();             //Launch the download
                                            console.log("Download starting ......");
                                            fileSize = engine.files[x].length;
                                            var range = req.headers.range;
                                            if (fileName.search(".mkv"))
                                                var mimetype = "mkv";
                                            else
                                                var mimetype = "mp4";
                                
                                            if (range)
                                            {
                                                const parts = range.replace(/bytes=/, "").split("-");
                                                const start = parseInt(parts[0], 10);
                                                console.log("start: "+start);
                                                const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
                                                console.log("end: "+end);
                                                const chunksize = (end-start)+1;
                                                console.log("chunckSize: "+chunksize);
                                                const head = {
                                                    'Content-Range': "bytes " + start + "-" + end + "/" + fileSize,
                                                    'Accept-Ranges': 'bytes', //required for the controls to work
                                                    'Content-Length': chunksize,
                                                    'Content-Type': 'video/'+mimetype,
                                                    Connection: 'keep-alive'
                                                }
                                                res.writeHead(206, head);
                                                var stream = engine.files[x].createReadStream({
                                                    start: start,
                                                    end: end
                                                })
                                                //stream.pipe(res);
                                                pump(stream, res);
                                            }
                                        }
                                    }).on('download', (fn) => {
                                        console.log("downloaded: "+engine.swarm.downloaded);
                                        if (engine.swarm.downloaded > movieInfo[0])
                                        {
                                            db.query("UPDATE movies SET downloadPercentage = ? WHERE movieName = ?", [engine.swarm.downloaded, movieName], (err, succ) => {
                                                if (err)
                                                    console.log(err);
                                            })
                                        }
                                    }).on('torrent', (fn) => {
                                        console.dir("torrent: "+fn);
                                    }).on('idle', (fn) => {
                                        console.log("Download complete");
                                        db.query("UPDATE movies SET magnet = ? WHERE movieName = ?", ["Download complete", movieName], (err, succ_2) => {
                                            if (err)
                                                console.log(err);
                                        })
                                    })
                                }
                            })
                        }
                    });
                    var directoryInfo = true;
                }
                else
                {
                    var directoryInfo = true;

                    db.query("SELECT * FROM movies WHERE movieName = ?", [movieName], (err, movieInfo) => {
                        if (err)
                            console.log(err);
                        else if (movieInfo.length > 0)
                        {
                            if (movieInfo[0].magnet == "Download Complete")
                            {
                                let stats = fs.statSync(movieInfo[0].path+"/"+movieInfo[0].torrentName);
                                let total = stats['size'];
                                let start = 0;
                                let end = total - 1;
                                let mimetype = movieMime;
        
                                //Updating the date info
                                let ts = Date.now();

                                let date_ob = new Date(ts);
                                let day = date_ob.getDate();
                                let month = date_ob.getMonth() + 1;
                                let year = date_ob.getFullYear();
                                
                                // prints date & time in YYYY-MM-DD format
                                var date = day+"/"+month+"/"+year;
                                db.query("UPDATE movies SET lastedWatched = ? WHERE movieName = ?", [date, movieName], (err_09, succ_09) => {
                                    if (err_09)
                                        console.log(err_09);
                                    else
                                        console.log("Inserted date");
                                })

                                if (req.headers.range) {
                                    let range = req.headers.range;
                                    let parts = range.replace(/bytes=/, '').split('-');
                                    let newStart = parts[0];
                                    let newEnd = parts[1];
        
                                    start = parseInt(newStart, 10);
                                    end = newEnd ? parseInt(newEnd, 10) : total - 1;
                                    let chunksize = end - start + 1;
        
                                    if (dev) console.log(start + ' : ' + end);
        
                                    res.writeHead(206, {
                                        'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
                                        'Accept-Ranges': 'bytes',
                                        'Content-Length': chunksize,
                                        'Content-Type': mimetype,
                                        Connection: 'keep-alive'
                                    });
        
                                    let stream = fs.createReadStream(movieInfo[0].path+"/"+movieInfo[0].torrentName, {
                                        start: start,
                                        end: end
                                    });
                                    pump(stream, res);
                                }      
                            }
                            else
                            {
                                const engine = torrentStream(movieInfo[0].magnet, {
                                    connections: 100,   
                                    uploads: 10,         
                                    path: movieInfo[0].path, 
                                    verify: true,                       
                                    trackers: [
                                        'udp://tracker.leechers-paradise.org:6969/announce',
                                        'udp://tracker.pirateparty.gr:6969/announce',
                                        'udp://tracker.coppersurfer.tk:6969/announce',
                                        'http://asnet.pw:2710/announce',
                                        'http://tracker.opentrackr.org:1337/announce',
                                        'udp://tracker.opentrackr.org:1337/announce',
                                        'udp://tracker1.xku.tv:6969/announce',
                                        'udp://tracker1.wasabii.com.tw:6969/announce',
                                        'udp://tracker.zer0day.to:1337/announce',
                                        'udp://p4p.arenabg.com:1337/announce',
                                        'http://tracker.internetwarriors.net:1337/announce',
                                        'udp://tracker.internetwarriors.net:1337/announce',
                                        'udp://allesanddro.de:1337/announce',
                                        'udp://9.rarbg.com:2710/announce',
                                        'udp://tracker.dler.org:6969/announce',
                                        'http://mgtracker.org:6969/announce',
                                        'http://tracker.mg64.net:6881/announce',
                                        'http://tracker.devil-torrents.pl:80/announce',
                                        'http://ipv4.tracker.harry.lu:80/announce',
                                        'http://tracker.electro-torrent.pl:80/announce'
                                    ]
                                });
                                var fileSize = null;
                                engine.on('ready', () => {
                                    var x = 0;
                                    console.log("ready");
                                    //Multiple files can download so we need to find the video by checking for the extension. X should stop on the file once found.
                                    //We dont need to check if the engine instance exists because ready will be ommited.
                                    while(engine.files[x])
                                    {
                                        if (engine.files[x].name.search(".mkv") > -1)
                                        {
                                            var format = "mkv";
                                            break;
                                        }
                                        else if (engine.files[x].name.search(".mp4") > -1)
                                        {
                                            var format = "mp4";
                                            break;
                                        }
                                        x++;
                                    }
                                    fileName = engine.files[x].name;
                                    db.query("UPDATE movies SET fullSize = ? WHERE movieName = ?", [engine.files[x].length, movieName], (err) => {
                                        if (err)
                                            console.log(err);
                                    })
                                    //Updating the date info
                                    let ts = Date.now();

                                    let date_ob = new Date(ts);
                                    let day = date_ob.getDate();
                                    let month = date_ob.getMonth() + 1;
                                    let year = date_ob.getFullYear();
                                        
                                    // prints date & time in YYYY-MM-DD format
                                    var date = day+"/"+month+"/"+year;
                                    db.query("UPDATE movies SET lastedWatched = ? WHERE movieName = ?", [date, movieName], (err_09, succ_09) => {
                                        if (err_09)
                                            console.log(err_09);
                                        else
                                            console.log("Inserted date");
                                    })
                                    //Just make sure that we found the correct file by checking the extension.
                                    if (fileName.search(".mkv") > -1 || fileName.search(".mp4") > -1)
                                    {
                                        engine.files[x].select();             //Launch the download
                                        console.log("Download starting ......");
                                        fileSize = engine.files[x].length;
                                        var range = req.headers.range;
                                        if (fileName.search(".mkv"))
                                            var mimetype = "mkv";
                                        else
                                            var mimetype = "mp4";
                            
                                        if (range)
                                        {
                                            const parts = range.replace(/bytes=/, "").split("-");
                                            const start = parseInt(parts[0], 10);
                                            console.log("start: "+start);
                                            const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
                                            console.log("end: "+end);
                                            const chunksize = (end-start)+1;
                                            console.log("chunckSize: "+chunksize);
                                            const head = {
                                                'Content-Range': "bytes " + start + "-" + end + "/" + fileSize,
                                                'Accept-Ranges': 'bytes', //required for the controls to work
                                                'Content-Length': chunksize,
                                                'Content-Type': 'video/'+format,
                                                Connection: 'keep-alive'
                                            }
                                            res.writeHead(206, head);
                                            var stream = engine.files[x].createReadStream({
                                                start: start,
                                                end: end
                                            })
                                            //stream.pipe(res);
                                            pump(steam, res);
                                        }
                                        else
                                        {
                                            res.writeHead(200, {
                                                'Content-Length': fileSize,
                                                Connection: 'keep-alive',
                                                'Content-Type': 'video/'+mimetype
                                            });
                
                                            let stream = fs.createReadStream(movie.filePath[quality], {
                                                start: start,
                                                end: end
                                            });
                                            pump(stream, res);
                                        }
                                    }
                                }).on('download', (fn) => {
                                    console.log("downloaded: "+engine.swarm.downloaded+" / "+fileSize);
                                    if (engine.swarm.downloaded > movieInfo[0])
                                    {
                                        db.query("UPDATE movies SET downloadPercentage = ? WHERE movieName = ?", [engine.swarm.downloaded, movieName], (err, succ) => {
                                            if (err)
                                                console.log(err);
                                        })
                                    }
                                }).on('torrent', (fn) => {
                                    console.dir("torrent: "+fn);
                                }).on('idle', (fn) => {
                                    console.log("Download complete");
                                    db.query("UPDATE movies SET magnet = ? WHERE movieName = ?", ["Download complete", movieName], (err, succ_2) => {
                                        if (err)
                                            console.log(err);
                                    })
                                })
                            }
                        }
                        else
                            res.send("An error has occured");
                    })
                }
            }
        }
    }
    else
        res.redirect('http://localhost:3002/login');
})
router.get('/movies/subtitle/:id', (req, res) => {
    if (req.session.username)
    {
        if (req.params.id)
        {
            var id = req.params.id;
            console.log("ID: "+id);
            OpenSubtitles.search({
                imdbid: id,
                sublanguageid: [ 'fre', 'eng', 'spa'].join()
            }).then((subtitles) => {
                let subtitlePath = path.join(__dirname, "../Subtitles");
                console.log("subpath: "+subtitlePath);
                console.log("Subtitle stuff: "+util.inspect(subtitles, {showHidden: false, depth: null}))
                console.log("look part 1: "+subtitles.en.url);
                if (subtitles.en && subtitles.en.url)
                {
                    console.log("look part 2: "+subtitles.en.url);
                    download(subtitles.en.url, subtitlePath)
                    .then(() => {
                        fs.stat(subtitlePath + '/' + subtitles.en.filename, (err) => {
                            if (err === null) {
                                var EnglishSubtitle = '/' + path.basename(subtitles.en.filename, '.srt') + '.vtt';
                                console.log("englishsub: "+subtitlePath+EnglishSubtitle);
                                console.log("creating read stream with: "+subtitlePath + '/' + subtitles.en.filename);
                                fs.createReadStream(subtitlePath + '/' + subtitles.en.filename).pipe(srt2vtt()).pipe(fs.createWriteStream(subtitlePath + EnglishSubtitle));
                                
                                var streamVtt = fs.createReadStream(subtitlePath+EnglishSubtitle);
                                streamVtt.pipe(res);
                            }
                        })
                    })
                }
                if (subtitles.fr && subtitles.fr.url)
                {
                    console.log("look part 2: "+subtitles.fr.url);
                    download(subtitles.fr.url, subtitlePath)
                    .then(() => {
                        fs.stat(subtitlePath + '/' + subtitles.fr.filename, (err) => {
                            if (err === null) {
                                var EnglishSubtitle = '/' + path.basename(subtitles.fr.filename, '.srt') + '.vtt';
                                console.log("englishsub: "+subtitlePath+EnglishSubtitle);
                                console.log("creating read stream with: "+subtitlePath + '/' + subtitles.fr.filename);
                                fs.createReadStream(subtitlePath + '/' + subtitles.fr.filename).pipe(srt2vtt()).pipe(fs.createWriteStream(subtitlePath + EnglishSubtitle));
                                
                                var streamVtt = fs.createReadStream(subtitlePath+EnglishSubtitle);
                                streamVtt.pipe(res);
                            }
                        })
                    })
                }
                if (subtitles.es && subtitles.es.url)
                {
                    console.log("look part 2: "+subtitles.sp.url);
                    download(subtitles.sp.url, subtitlePath)
                    .then(() => {
                        fs.stat(subtitlePath + '/' + subtitles.sp.filename, (err) => {
                            if (err === null) {
                                var EnglishSubtitle = '/' + path.basename(subtitles.sp.filename, '.srt') + '.vtt';
                                console.log("englishsub: "+subtitlePath+EnglishSubtitle);
                                console.log("creating read stream with: "+subtitlePath + '/' + subtitles.sp.filename);
                                fs.createReadStream(subtitlePath + '/' + subtitles.sp.filename).pipe(srt2vtt()).pipe(fs.createWriteStream(subtitlePath + EnglishSubtitle));
                                
                                var streamVtt = fs.createReadStream(subtitlePath+EnglishSubtitle);
                                streamVtt.pipe(res);
                            }
                        })
                    })
                }
            })
        }
    }
    else
        res.redirect('http://localhost:3002/login');
})






router.get('/series', (req, res) => {
    if (req.session.username)
    {
        if (req.query.search)
        {
            var series = [];
            var search = req.query.search;
            var url_1 = "https://api.themoviedb.org/3/search/tv?api_key=" + api_key + "&query=" + search;
            var url_2 = "http://www.omdbapi.com/?apikey="+apiKey_2+"&s="+search+"&plot=full&type=series";

            var Request_1 = unirest('GET', url_1);
            var Request_2 = unirest('GET', url_2);

            Request_1.end((response_1) => {
                Request_2.end((response_2) => {
                    var x = 0;
                    var y = 0;
                    while (response_1.body.results[x])
                    {
                        var imageUrl = "https://image.tmdb.org/t/p/w500"+response_1.body.results[x].poster_path;
                        series.push(new Series(response_1.body.results[x].original_name, imageUrl, response_1.body.results[x].id, "moviedb"));
                        x++;
                    }
                    console.log(util.inspect(response_2.body, {showHidden: false, depth: null}));
                    if (response_2.body.Search != undefined)
                    {
                        while (response_2.body.Search[y])
                        {
                            var imageUrl_2 = response_2.body.Search[y].Poster;
                            var title = response_2.body.Search[y].Title;
                            var id = response_2.body.Search[y].imdbID;
                            series.push(new Series(title, imageUrl_2, id, "omdb"));
                            y++;
                        }
                    }
                    var count = Math.trunc(series.length / 5);
                    if ((series.length % 5) > 0)
                        count++;
                    fastSort(series).asc(s => s.title);
                    db.query("SELECT * FROM seriesViews WHERE username = ?", [req.session.username], (err, succ) => {
                        if (err)
                            console.log(err);
                        else if (succ.length > 0)
                        {
                            var x = 0;
                            var watchedSeries = [];

                            while(succ[x])
                            {
                                watchedSeries[x] = succ[x].seriesWatched;
                                x++;
                            }
                            console.log("watched: "+watchedSeries[0]);
                            res.render('series', { search_results: series , popular_series: "", rows: count, seriesWatched: watchedSeries});
                        }
                        else
                        {
                            res.render('series', { search_results: series , popular_series: "", rows: count, seriesWatched: []});
                        }
                    });
                })
            })
        }
        else if (req.query.sortingResults)
        {
            console.log("results: "+req.query.sortingResults);
            var url = "https://api.themoviedb.org/3/movie/popular?api_key="+api_key+"&page=1";

            var popularSeries = unirest('GET', url)
            popularSeries.end((response) => {
                if (response)
                {
                    if (req.query.sortingResults == "name.asc")
                        fastSort(response.body.results).asc(s => s.title);
                    else if (req.query.sortingResults == "name.desc")
                        fastSort(response.body.results).desc(s => s.title);
                    else if (req.query.sortingResults == "popularity.asc")
                        fastSort(response.body.results).desc(s => s.vote_count);
                    else if (req.query.sortingResults == "popularity.desc")
                        fastSort(response.body.results).desc(s => s.vote_count);
                        res.render('series', {search_results: "", popular_series: response.body.results, rows: null});
                }
                else
                    res.send("An error has occured");
            })
        }
        else
        {
            console.log("Im here pig");
            var url = "https://api.themoviedb.org/3/tv/popular?api_key="+api_key+"&page=1";

            var popular_series = [];
            var Request_1 = unirest('GET', url);
            Request_1.end((response_1) => {
                var x = 0;
                /*while (response_1.body.results[x])
                {
                    var imageUrl = "https://image.tmdb.org/t/p/w500"+response_1.body.results[x].poster_path;
                    popular_series.push(new Series(response_1.body.results[x].original_name, imageUrl, response_1.body.results[x].overview, response_1.body.results[x].popularity, response_1.body.results[x].id));
                    x++;
                }*/
                //fastSort(popular_series).desc(s => s.popularity);
                res.render('series', {search_results: "", popular_series: response_1.body.results, rows: null});
            })
        }
    }
    else
        res.redirect('http://localhost:3002/login');
})
router.post('/series/seasons', (req, res) => {
    if (req.session.username)
    {
        console.log("Series/seasons route");
        var id = req.body.id;
        var provider = req.body.provider;
        var url = "";

        if (provider == "moviedb")
            url = "https://api.themoviedb.org/3/tv/"+id+"?api_key="+api_key;
        else
            url = "http://www.omdbapi.com/?apikey="+apiKey_2+"&i="+id;

        var Request_1 = unirest('GET', url);
        Request_1.end((response) => {
            if (provider == "moviedb")
            {
                if (response.body.name != undefined)
                {
                    req.session.seriesName = response.body.name;
                    res.render('seasons_moviedb', {seasons: response.body.seasons, tv_id: id, provider: "moviedb"});
                }
                else
                    //deal with the error that no info was returned.
                    res.send("An error occured");
            }
            else if (provider == "omdb")
            {
                console.log("omdb provider");
                if (req.body.id)
                    var om_id = req.body.id;
                else
                    var om_id = "";
                if (req.body.poster)
                    var poster = req.body.poster;
                else
                    var poster = "";
                if (response.body.totalSeasons)
                    var totalSeasons = response.body.totalSeasons;
                else
                    var totalSeasons = ""
                if (response.body.Plot)
                    var plot = response.body.Plot;
                else
                    var plot = "";

                console.log("id: "+om_id);
                console.log("poster: "+poster);
                console.log("totalSeasons: "+totalSeasons);
                console.log("plot: "+plot);
                if (om_id.length > 0 && poster.length > 0 && totalSeasons.length > 0 && plot.length > 0)
                {
                    if (poster == 'N/A')
                        poster = "https://media.istockphoto.com/vectors/image-unavailable-icon-vector-id1199906477";
                    res.render('seasons_omdb', {id: om_id, poster: poster, provider: "omdb", totalSeasons: totalSeasons, plot: plot});
                }
                else
                {
                    res.send("An error occured");
                }
            }
        });
    }
    else
        res.redirect('http://localhost:3002/login');
})
router.post('/series/seasons/episodes', (req, res) => {
    if (req.session.username)
        {
        var id = req.body.tv_id;
        var season_number = req.body.season_number;
        console.log("seasonnumber: "+season_number);

        if (req.body.provider == 'moviedb')
            var url = "https://api.themoviedb.org/3/tv/"+id+"/season/"+season_number+"?api_key="+api_key;
        else
            var url = "http://www.omdbapi.com/?apiKey="+apiKey_2+"&i="+id+"&Season="+season_number;
            console.log("url: "+url);
        var Request = unirest('GET', url);

        Request.end((response) => {
            if (req.body.provider == "moviedb")
                res.render('episodes', {episodes: response.body.episodes, tv_id: id, provider: "moviedb"});
            else if (req.body.provider == "omdb")
            {
                req.session.seriesName = response.body.Title;
                console.log("problem: "+util.inspect(response.body.Episodes, {showHidden: false, depth: null}));
                res.render('episodes', {episodes: response.body.Episodes, tv_id: id, provider: "omdb", season_number: season_number});
            }
            else
                console.log("An error has occured");
        })
    }
    else
        es.redirect('http://localhost:3002/login');
})

router.post('/series/seasons/episodes/video_player', (req, res) => {
    if (req.session.username)
    {
        var id = req.body.tv_id;
        var season_number = req.body.season_number;
        var episode_number = req.body.episode_number;
        var episode_name = req.body.episode_name;
        var provider = req.body.provider;
        if (provider == "moviedb")
            var url = "https://api.themoviedb.org/3/tv/"+id+"/season/"+season_number+"/episode/"+episode_number+"?api_key="+api_key;
        else if (provider == "omdb")
            var url = "http://www.omdbapi.com/?apiKey="+apiKey_2+"&t="+req.session.seriesName+"&Season="+season_number+"&Episode="+episode_number;
        
        var url_2_IMDBID = "http://www.omdbapi.com/?apiKey="+apiKey_2+"&t="+req.session.seriesName+"&Season="+season_number+"&Episode="+episode_number
        if (season_number >= 10)
            var extraNumber = "";
        else
            var extraNumber = "0";
        if (episode_number >= 10)
            var extraNumber_2 = "";
        else
            var extraNumber_2 = "0";
        var seriesName = req.session.seriesName+" "+"s"+extraNumber+season_number+"e"+extraNumber_2+episode_number;
        console.log("seeeeee: "+seriesName);
        //Make a directory for the series to be downloaded in only if it does not exist
        /*var dir = path.join(__dirname, '/series/'+seriesName);
        if (fs.existsSync(dir))
        {

        }
        else
        {
            fs.mkdir(dir, (err) => { 
                if (err) { 
                    return console.error(err); 
                } 
                console.log('Directory created successfully!'); 
            });
        }*/

        async function search()
        {
            // Search '1080' in 'Movies' category and limit to 20 results
            var torrents = await TorrentSearchApi.search(seriesName, 'Video', 20);
            //console.log("active provider: "+util.inspect(TorrentSearchApi.getActiveProviders(), {showHidden: false, depth: null}));
        //console.log(util.inspect(torrents, {showHidden: false, depth: null}));
            var x = 0;
            if (torrents.length > 0)
            {
                var x = 0;
                while (torrents[x])
                {
                    if (torrents[x].title.search('mp4') || torrents[x].title.search('mkv'))
                    {
                        magnet = torrents[x].magnet;
                        break;
                    }
                    x++;
                }
            }
            console.log("magnet: "+magnet);
        }
        search();
        //Record the series that you started watching.
        db.query("INSERT INTO seriesViews (username, seriesWatched) VALUES (?, ?)", [req.session.username, req.session.seriesName], (err, succ) => {
            if (err)
                console.log(err)
        })
        var Request_1 = unirest('GET', url);
        var Request_2 = unirest('GET', url_2_IMDBID);

        Request_1.end((response) => {
            Request_2.end((response_2) => {
                res.render('video', {episode_info: response.body, progress: "", imdbId: response_2.body.imdbID});
            })
        })
    }
    else
        res.redirect('http://localhost:3002/login');
})

router.get("/series/video", (req, res) => {
    if (req.session.username)
    {
        console.log("Hello there im in video route");
        //console.log("progress: "+notify);
        console.log("magnet: "+magnet);
        console.log("torrentPath: "+torrentPath);
        console.log("container: "+container);

        //----------------------------------------------------------------------
        if (magnet != null)
        {
            console.log("We are insied pf f if");
            console.log("magnet data: "+magnet);
            console.log("searching: "+magnet.search("magnet"));
        
            if (magnet.search("magnet") > -1)
            { 
                //check if movie directory exists.
                var dir = path.join(__dirname, '../series', '/'+req.session.seriesName);
                var results = fs.existsSync(dir); 

                db.query("SELECT * FROM series WHERE magnet = ?", [magnet], (err_08, succ_08) => {
                    if (err_08)
                        console.log(err_08)
                    if (results == false || (results == true && succ_08.length == 0))
                    {
                        if (results == true)
                            mkdirp.sync(dir);
        
                        console.log("We are insied pf s if");
                        //torrent found with magnet link
                        //Provide the magnetLink to torrentStream
                        db.query("INSERT INTO series (seriesName, path, fullSize, downloadPercentage, magnet, torrentName) VALUES (?, ?, ?, ?, ?, ?)", [req.session.seriesName, dir, 0, 0, magnet, ""], (err, succ) => {
                            if (err)
                                console.log(err);
                            else
                            {
                                db.query("SELECT * FROM series WHERE seriesName = ?", [req.session.seriesName], (err, seriesInfo) => {
                                    if (err)
                                        console.log(err);
                                    else
                                    {
                                        const engine = torrentStream(magnet, {
                                            connections: 100,   
                                            uploads: 10,         
                                            path: dir, 
                                            verify: true,                       
                                            trackers: [
                                                'udp://tracker.leechers-paradise.org:6969/announce',
                                                'udp://tracker.pirateparty.gr:6969/announce',
                                                'udp://tracker.coppersurfer.tk:6969/announce',
                                                'http://asnet.pw:2710/announce',
                                                'http://tracker.opentrackr.org:1337/announce',
                                                'udp://tracker.opentrackr.org:1337/announce',
                                                'udp://tracker1.xku.tv:6969/announce',
                                                'udp://tracker1.wasabii.com.tw:6969/announce',
                                                'udp://tracker.zer0day.to:1337/announce',
                                                'udp://p4p.arenabg.com:1337/announce',
                                                'http://tracker.internetwarriors.net:1337/announce',
                                                'udp://tracker.internetwarriors.net:1337/announce',
                                                'udp://allesanddro.de:1337/announce',
                                                'udp://9.rarbg.com:2710/announce',
                                                'udp://tracker.dler.org:6969/announce',
                                                'http://mgtracker.org:6969/announce',
                                                'http://tracker.mg64.net:6881/announce',
                                                'http://tracker.devil-torrents.pl:80/announce',
                                                'http://ipv4.tracker.harry.lu:80/announce',
                                                'http://tracker.electro-torrent.pl:80/announce'
                                            ]
                                        });
                                        
                                        engine.on('ready', () => {
                                            var x = 0;
                                            console.log("ready");
                                            //Multiple files can download so we need to find the video by checking for the extension. X should stop on the file once found.
                                            //We dont need to check if the engine instance exists because ready will be ommited.
                                            while(engine.files[x])
                                            {
                                                if (engine.files[x].name.search(".mkv") || engine.files[x].name.search(".mp4"))
                                                    break;
                                                x++;
                                            }
                                            console.log("look: dsa "+engine.files[x].name);
                                            fileName = engine.files[x].name;
                                        
                                            //Just make sure that we found the correct file by checking the extension.
                                            if (fileName.search(".mkv") > -1 || fileName.search(".mp4") > -1)
                                            {
                                                engine.files[x].select();             //Launch the download
                                                console.log("Download starting ......");
                                                var fileSize = engine.files[x].length;
                                                var range = req.headers.range;
        
                                                console.log("req.session.seriesName: "+req.session.seriesName);
                                                db.query("UPDATE series SET fullSize = ? WHERE seriesName = ?", [fileSize, req.session.seriesName], (err_2, succ_2) => {
                                                    if (err_2)
                                                        console.log(err_2);
                                                })
                                                db.query("UPDATE series SET torrentName = ? WHERE seriesName = ?", [fileName, req.session.seriesName], (err_15, succ_15) => {
                                                    if (err_15)
                                                        console.log(err_15);
                                                    else
                                                        console.log("Success insertion");
                                                })
                                                //Updating the date info
                                                let ts = Date.now();

                                                let date_ob = new Date(ts);
                                                let day = date_ob.getDate();
                                                let month = date_ob.getMonth() + 1;
                                                let year = date_ob.getFullYear();
                                                
                                                // prints date & time in YYYY-MM-DD format
                                                var date = day+"/"+month+"/"+year;
                                                db.query("UPDATE series SET lastedWatched = ? WHERE seriesName = ? AND torrentName = ?", [date, req.session.seriesName, fileName], (err_09, succ_09) => {
                                                    if (err_09)
                                                        console.log(err_09);
                                                    else
                                                        console.log("Inserted date");
                                                })
        
                                                if (range)
                                                {
                                                    const parts = range.replace(/bytes=/, "").split("-");
                                                    const start = parseInt(parts[0], 10);
                                                    console.log("start: "+start);
                                                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
                                                    console.log("end: "+end);
                                                    const chunksize = (end-start)+1;
                                                    console.log("chunckSize: "+chunksize);
                                                    const head = {
                                                        'Content-Range': "bytes " + start + "-" + end + "/" + fileSize,
                                                        'Accept-Ranges': 'bytes', //required for the controls to work
                                                        'Content-Length': chunksize,
                                                        'Content-Type': 'video/'+container,
                                                        Connection: 'keep-alive'
                                                    }
                                                    res.writeHead(206, head);
                                                    var stream = engine.files[x].createReadStream({
                                                        start: start,
                                                        end: end
                                                    })
                                                    //stream.pipe(res);
                                                    pump(stream, res);
                                                }
                                            }
                                            else
                                            {
                                                console.log("No torrents found");
                                                //handle error
                                            }
                                        }).on('download', () => {
                                            if (engine.swarm.downloaded > seriesInfo[0].downloadPercentage)
                                            {
                                                db.query("UPDATE series SET downloadPercentage = ? WHERE seriesName = ?", [engine.swarm.downloaded, req.session.seriesName], (err, succ) => {
                                                    if (err)
                                                        console.log(err);
                                                })
                                            }
                                            console.log("download percentage: "+engine.swarm.downloaded+" / "+seriesInfo[0].fullSize);
                                        }).on('torrent', (fn) => {
                                            console.dir("torrent: "+fn);
                                        }).on('idle', () => {
                                            console.log("Series download complete");
                                            db.query("UPDATE series SET magnet = ? WHERE seriesName = ?", ["Download complete", req.session.seriesName], (err_3, succ_3) => {
                                                if (err_3)
                                                    console.log(err_3);
                                            })
                                        })
                                    }
                                })
                            }
                        })
                    }
                    else if (results == true && succ_08.length > 0)
                    {
                        db.query("SELECT * FROM series WHERE seriesName = ?", [req.session.seriesName], (err, seriesInfo) => {
                            if (err)
                                console.log(err)
                            else if (seriesInfo[0].magnet == "Download complete")
                            {
                                //Updating the date info
                                let ts = Date.now();

                                let date_ob = new Date(ts);
                                let day = date_ob.getDate();
                                let month = date_ob.getMonth() + 1;
                                let year = date_ob.getFullYear();
                                        
                                // prints date & time in YYYY-MM-DD format
                                var date = day+"/"+month+"/"+year;
                                db.query("UPDATE series SET lastedWatched = ? WHERE seriesName = ? AND torrentName = ?", [date, movieName, seriesInfo], (err_09, succ_09) => {
                                    if (err_09)
                                        console.log(err_09);
                                    else
                                        console.log("Inserted date");
                                })
                                let stats = fs.statSync(seriesInfo[0].path+"/"+seriesInfo[0].torrentName);
                                let total = stats['size'];
                                let start = 0;
                                let end = total - 1;
                                let mimetype = 'video/'+container;
        
                                if (req.headers.range) {
                                    let range = req.headers.range;
                                    let parts = range.replace(/bytes=/, '').split('-');
                                    let newStart = parts[0];
                                    let newEnd = parts[1];
        
                                    start = parseInt(newStart, 10);
                                    end = newEnd ? parseInt(newEnd, 10) : total - 1;
                                    let chunksize = end - start + 1;
        
                                    if (dev) console.log(start + ' : ' + end);
        
                                    res.writeHead(206, {
                                        'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
                                        'Accept-Ranges': 'bytes',
                                        'Content-Length': chunksize,
                                        'Content-Type': mimetype,
                                        Connection: 'keep-alive'
                                    });
        
                                    let stream = fs.createReadStream(seriesInfo[0].path+"/"+seriesInfo[0].torrentName, {
                                        start: start,
                                        end: end
                                    });
                                    pump(stream, res);
                                }
                            }
                            else
                            {
                                const engine = torrentStream(seriesInfo[0].magnet, {
                                    connections: 100,   
                                    uploads: 10,         
                                    path: seriesInfo[0].path, 
                                    verify: true,                       
                                    trackers: [
                                        'udp://tracker.leechers-paradise.org:6969/announce',
                                        'udp://tracker.pirateparty.gr:6969/announce',
                                        'udp://tracker.coppersurfer.tk:6969/announce',
                                        'http://asnet.pw:2710/announce',
                                        'http://tracker.opentrackr.org:1337/announce',
                                        'udp://tracker.opentrackr.org:1337/announce',
                                        'udp://tracker1.xku.tv:6969/announce',
                                        'udp://tracker1.wasabii.com.tw:6969/announce',
                                        'udp://tracker.zer0day.to:1337/announce',
                                        'udp://p4p.arenabg.com:1337/announce',
                                        'http://tracker.internetwarriors.net:1337/announce',
                                        'udp://tracker.internetwarriors.net:1337/announce',
                                        'udp://allesanddro.de:1337/announce',
                                        'udp://9.rarbg.com:2710/announce',
                                        'udp://tracker.dler.org:6969/announce',
                                        'http://mgtracker.org:6969/announce',
                                        'http://tracker.mg64.net:6881/announce',
                                        'http://tracker.devil-torrents.pl:80/announce',
                                        'http://ipv4.tracker.harry.lu:80/announce',
                                        'http://tracker.electro-torrent.pl:80/announce'
                                    ]
                                });
                                
                                engine.on('ready', () => {
                                    var x = 0;
                                    console.log("ready");
                                    //Multiple files can download so we need to find the video by checking for the extension. X should stop on the file once found.
                                    //We dont need to check if the engine instance exists because ready will be ommited.
                                    while(engine.files[x])
                                    {
                                        if (engine.files[x].name.search(".mkv") > -1 || engine.files[x].name.search(".mp4") > -1)
                                            break;
                                        x++;
                                    }
                                    fileName = engine.files[x].name;
                                    
                                    //Just make sure that we found the correct file by checking the extension.
                                    if (fileName.search(".mkv") > -1 || fileName.search(".mp4") > -1)
                                    {
                                        engine.files[x].select();             //Launch the download
                                        console.log("Download starting ......");
                                        var fileSize = engine.files[x].length;
                                        var range = req.headers.range;
                
                                        //Updating the date info
                                        let ts = Date.now();

                                        let date_ob = new Date(ts);
                                        let day = date_ob.getDate();
                                        let month = date_ob.getMonth() + 1;
                                        let year = date_ob.getFullYear();
                                                
                                        // prints date & time in YYYY-MM-DD format
                                        var date = day+"/"+month+"/"+year;
                                        db.query("UPDATE series SET lastedWatched = ? WHERE seriesName = ? AND torrentName = ?", [date, movieName, fileName], (err_09, succ_09) => {
                                            if (err_09)
                                                console.log(err_09);
                                            else
                                                console.log("Inserted date");
                                        })
                                        if (range)
                                        {
                                            const parts = range.replace(/bytes=/, "").split("-");
                                            const start = parseInt(parts[0], 10);
                                            console.log("start: "+start);
                                            const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
                                            console.log("end: "+end);
                                            const chunksize = (end-start)+1;
                                            console.log("chunckSize: "+chunksize);
                                            const head = {
                                                'Content-Range': "bytes " + start + "-" + end + "/" + fileSize,
                                                'Accept-Ranges': 'bytes', //required for the controls to work
                                                'Content-Length': chunksize,
                                                'Content-Type': 'video/'+container,
                                                Connection: 'keep-alive'
                                            }
                                            res.writeHead(206, head);
                                            var stream = engine.files[x].createReadStream({
                                                start: start,
                                                end: end
                                            })
                                            //stream.pipe(res);
                                            pump(stream, res);
                                        }
                                    }
                                }).on('download', () => {
                                    if (engine.swarm.downloaded > seriesInfo[0].downloadPercentage)
                                    {
                                        db.query("UPDATE series SET downloadPercentage = ? WHERE seriesName = ?", [engine.swarm.downloaded, req.session.seriesName], (err, succ) => {
                                            if (err)
                                                console.log(err);
                                        })
                                    }
                                    console.log("download percentage: "+engine.swarm.downloaded+" / "+seriesInfo[0].fullSize);
                                }).on('torrent', (fn) => {
                                    console.dir("torrent: "+fn);
                                }).on('idle', () => {
                                    console.log("Series download complete");
                                    db.qeury("UPDATE series SET magnet = ? WHERE seriesName = ?", ["Download complete", req.session.seriesName], (err_3, succ_3) => {
                                        if (err_3)
                                            console.log(err_3);
                                    })
                                })
                            }
                        })
                    }  
                })
            }
        }
    }
    else
        res.redirect('http://localhost:3002/login');
})


router.get('/series/subtitle/:id', (req, res) => {
    if (req.session.username)
    {
        console.log("ID: "+req.params.id);
        if (req.params.id)
        {
            var id = req.params.id;
            console.log("ID: "+id);
            OpenSubtitles.search({
                imdbid: id,
                sublanguageid: [ 'fre', 'eng', 'spa'].join()
            }).then((subtitles) => {
                let subtitlePath = path.join(__dirname, "../Subtitles");
                console.log("subpath: "+subtitlePath);
                console.log("Subtitle stuff: "+util.inspect(subtitles, {showHidden: false, depth: null}))
                console.log("look part 1: "+subtitles.en.url);
                if (subtitles.en && subtitles.en.url)
                {
                    console.log("look part 2: "+subtitles.en.url);
                    download(subtitles.en.url, subtitlePath)
                    .then(() => {
                        fs.stat(subtitlePath + '/' + subtitles.en.filename, (err) => {
                            if (err === null) {
                                var EnglishSubtitle = '/' + path.basename(subtitles.en.filename, '.srt') + '.vtt';
                                console.log("englishsub: "+subtitlePath+EnglishSubtitle);
                                console.log("creating read stream with: "+subtitlePath + '/' + subtitles.en.filename);
                                fs.createReadStream(subtitlePath + '/' + subtitles.en.filename).pipe(srt2vtt()).pipe(fs.createWriteStream(subtitlePath + EnglishSubtitle));
                                
                                var streamVtt = fs.createReadStream(subtitlePath+EnglishSubtitle);
                                streamVtt.pipe(res);
                            }
                        })
                    })
                }
                if (subtitles.fr && subtitles.fr.url)
                {
                    console.log("look part 2: "+subtitles.fr.url);
                    download(subtitles.fr.url, subtitlePath)
                    .then(() => {
                        fs.stat(subtitlePath + '/' + subtitles.fr.filename, (err) => {
                            if (err === null) {
                                var EnglishSubtitle = '/' + path.basename(subtitles.fr.filename, '.srt') + '.vtt';
                                console.log("englishsub: "+subtitlePath+EnglishSubtitle);
                                console.log("creating read stream with: "+subtitlePath + '/' + subtitles.fr.filename);
                                fs.createReadStream(subtitlePath + '/' + subtitles.fr.filename).pipe(srt2vtt()).pipe(fs.createWriteStream(subtitlePath + EnglishSubtitle));
                                
                                var streamVtt = fs.createReadStream(subtitlePath+EnglishSubtitle);
                                streamVtt.pipe(res);
                            }
                        })
                    })
                }
                if (subtitles.es && subtitles.es.url)
                {
                    console.log("look part 2: "+subtitles.sp.url);
                    download(subtitles.sp.url, subtitlePath)
                    .then(() => {
                        fs.stat(subtitlePath + '/' + subtitles.sp.filename, (err) => {
                            if (err === null) {
                                var EnglishSubtitle = '/' + path.basename(subtitles.sp.filename, '.srt') + '.vtt';
                                console.log("englishsub: "+subtitlePath+EnglishSubtitle);
                                console.log("creating read stream with: "+subtitlePath + '/' + subtitles.sp.filename);
                                fs.createReadStream(subtitlePath + '/' + subtitles.sp.filename).pipe(srt2vtt()).pipe(fs.createWriteStream(subtitlePath + EnglishSubtitle));
                                
                                var streamVtt = fs.createReadStream(subtitlePath+EnglishSubtitle);
                                streamVtt.pipe(res);
                            }
                        })
                    })
                }
            })
        }
    }
    else
        res.redirect('http://localhost:3002/login');
})

module.exports = router;