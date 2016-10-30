var fs = require('fs')
    , _path = require("path")
    , http = require('http')
    , socketio = require('socket.io')
    , wrench = require("wrench");

function isDirectory(fname){
    return fs.existsSync(_path.join(__dirname, fname)) ? fs.statSync( _path.join(__dirname, fname) ).isDirectory() : false;
}

// load up all resources statically
var html = fs.readFileSync(__dirname + '/index.html');

var jsFiles = [];
wrench.readdirRecursive(__dirname + '/app', function(error, curFiles) {
    if(curFiles) {
        for (var i = 0; i < curFiles.length; i++) {
            if(curFiles[i].slice( -2 ) == 'js') {
                console.log("Loading "+__dirname+"/app/"+curFiles[i]);
                jsFiles["/app/"+curFiles[i]]=fs.readFileSync(__dirname+"/app/"+curFiles[i]);
            }
        }
    }
});

var cssFiles = [];
wrench.readdirRecursive(__dirname + '/css', function(error, curFiles) {
    if(curFiles) {
        for (var i = 0; i < curFiles.length; i++) {
            if(curFiles[i].slice( -3 ) == 'css') {
                console.log("Loading "+__dirname+"/css/"+curFiles[i]);
                cssFiles["/css/"+curFiles[i]]=fs.readFileSync(__dirname+"/css/"+curFiles[i]);
            }
        }
    }
});

var imgFiles = [];
wrench.readdirRecursive(__dirname + '/img', function(error, curFiles) {
    if(curFiles) {
        for (var i = 0; i < curFiles.length; i++) {
            if(curFiles[i].slice( -3 ) == 'png') {
                console.log("Loading "+__dirname+"/img/"+curFiles[i]);
                imgFiles["/img/"+curFiles[i]]=fs.readFileSync(__dirname+"/img/"+curFiles[i]);
            }
        }
    }
});

var assFiles = [];
wrench.readdirRecursive(__dirname + '/assets', function(error, curFiles) {
    if(curFiles) {
        for (var i = 0; i < curFiles.length; i++) {
            if(!isDirectory("/assets/"+curFiles[i])) {
                console.log("Loading "+__dirname+"/assets/"+curFiles[i]);
                assFiles["/assets/"+curFiles[i]]=fs.readFileSync(__dirname+"/assets/"+curFiles[i]);
            }
        }
    }
});

var server = http.createServer(function(req, res) {

    // img first
    if(req.url.slice( -3 ) == 'png') {
        res.writeHead(200, {"Content-Type": "image/png"});
        res.write(imgFiles[req.url]);

    }

    // assets
    if(req.url.indexOf("/assets/")==0) {
        res.writeHead(200);
        res.write(assFiles[req.url]);
    }

    // css
    if(req.url.slice( -3 ) == 'css') {
        res.writeHead(200, {"Content-Type": "text/css"});
        res.write(cssFiles[req.url]);
    }
    // js
    if(req.url.slice( -2 ) == 'js') {

        res.writeHead(200, {"Content-Type": "text/js"});
        res.write(jsFiles[req.url]);
    }

    if(req.url == '/') {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(html);
    }
    res.end();
}).listen(8080, function() {
    console.log('Listening at: http://localhost:8080');
});

var players = [];

socketio.listen(server).on('connection', function (socket) {
    
    socket.emit('connectionId', socket.id);
    console.log("#"+socket.id+ " connected.");

    socket.on('message', function (data) {
        console.log('#' + data.id + ": " + data.message);
        socket.broadcast.emit('message', data);
    });

    // when someone finishes initialization
    socket.on('playerMeshCreate', function(player) {
        //send the other players
        for(var play in players) {
            socket.emit('newPlayer', players[play]);
        }
        //push its data
        players[player.id]=player;
        socket.broadcast.emit('newPlayer', player);
    });

    socket.on('playerMove', function(player) {
        players[player.id]=player;
        socket.broadcast.emit('playerMove',player);
    });

    socket.on('disconnect', function() {
        delete players[socket.id];
        socket.broadcast.emit('playerRemove',socket.id);
    });
    
});
