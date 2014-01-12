
// process.env.ENV = 'production';

var Game = require('./app.init').Game
var urlParser = require('url');
var http = require('http');
var cookieParser = require('cookie');


var port = process.env.PORT || 9003;

var $ = {
    get: function (url, cb) {

        if (!cb) cb = function () { };

        var options = {
            hostname: 'api.jok.ge',
            port: 80,
            path: url,
            method: 'GET'
        };

        var req = http.request(options, function (res) {

            var data = '';

            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function (chunk) {
                try {
                    cb(JSON.parse(data));
                }
                catch (err) { cb(); }
            });
        });

        req.on('error', function (e) {
            cb();
        });

        req.end();
    }
}

/* Wrapper instance to get Game.Server */
var ws = {
    isInitialized: false,
    initialize: function () {
        if (ws.isInitialized) return;


        new Game.Server(ws).start();
    },
    addApplication: function (gameServer) {
        ws.gameServer = gameServer;
        ws.isInitialized = true;

        if (ws.gameServer.onidle) {
            setInterval(ws.gameServer.onidle.bind(ws.gameServer), 1000 / 60 /*FPS*/);
        }
    },
    send: function (id, data) {
        if (!(id in clients)) { return; }
        if (!clients[id].readyState == 'open') { return; }

        // console.log('sending', id, data)

        clients[id].send(data);
    },
    setDebug: function () {

    },
    updateScore: function (dead_id, killer_id) {

        if (!(killer_id in clients)) { return; }
        var userid = clients[killer_id].userid;

        $.get('/game/' + userid + '/GalaxyRatingAdd?secret=sercet');
    }
}
ws.initialize();


/* Web Server */
var engine = require('engine.io')
  , server = new engine.listen(port)


function originIsAllowed(origin) {
    return true;
}

var userTricks = 0;
var clients = [];

server.on('connection', function (socket) {

    if (!originIsAllowed(socket.transport.request.headers.origin)) {
        return;
    }

    var sid;

    try {
        var cookies = cookieParser.parse(socket.transport.request.headers.cookie);
        sid = cookies.sid;
    }
    catch (err) { }

    if (!sid) {
        return;
    }

    var ipaddress = socket.transport.request.headers['x-forwarded-for'];
    if (!ipaddress)
        ipaddress = socket.transport.request.connection.remoteAddress;

    console.log('sid', sid, ipaddress);

    $.get('/user/' + sid + '/getinfo?gameid=10&ipaddress=' + ipaddress, function (result) {

        if (!result || !result.IsSuccess) {
            return;
        }


        var connection = socket; //request.accept(null, request.origin);
        var isDisconnected = false;


        connection.userid = result.UserID;
        connection.clientid = Math.random().toString().replace("0.", "");
        clients[connection.clientid] = connection;

        ws.gameServer.onconnect(connection.clientid, undefined/*request.httpRequest.headers*/);


        connection.on('message', function (message) {
            if (process.env.ENV != 'production') {
                console.log('Received Message: ' + message);
            }

            ws.gameServer.onmessage(connection.clientid, message);
        });
        connection.on('close', function (reasonCode, description) {
            isDisconnected = true;

            if (connection.clientid in clients) {
                delete clients[connection.clientid];
            }

            if (process.env.ENV != 'production') {
                console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
            }
            ws.gameServer.ondisconnect(connection.clientid, '', '');
        });
        connection.on('error', function (err) {
            isDisconnected = true;
            // console.log('error: [' + connection.clientid + '] ' + err);
        });
    });
});



// ws.gameServer.onconnect(connection.clientid, request.httpRequest.headers);
// ws.gameServer.onmessage(connection.clientid, message.utf8Data);
// ws.gameServer.ondisconnect(connection.clientid, '', '');




