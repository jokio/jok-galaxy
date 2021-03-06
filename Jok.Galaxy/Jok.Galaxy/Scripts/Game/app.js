
// process.env.ENV = 'production';

var Game = require('./app.init').Game
var urlParser = require('url');
var http = require('http');
var cookieParser = require('cookie');


var port = process.env.PORT || 9003;

var $ = {
    get: function (url, cb, io) {

        if (!cb) cb = function () { };

        var options = {
            hostname: io ? 'api.jok.io' : 'api.jok.ge',
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
    clients: {},
    isInitialized: false,
    initialize: function () {
        if (ws.isInitialized) return;

        new Game.Server(ws).start();
    },
    addApplication: function (gameServer) {
        ws.gameServer = gameServer;
        ws.isInitialized = true;

        if (ws.gameServer.onidle) {
            setInterval(function () {
                ws.gameServer.onidle.call(ws.gameServer);
            }, 1000 / 60 /*FPS*/);
        }
    },
    send: function (id, data) {
        if (!(id in this.clients)) { return; }
        if (!clients[id].readyState == 'open') { return; }

        // console.log('sending', id, data)

        clients[id].send(data);

        return true;
    },
    setDebug: function () {

    },
    updateScore: function (dead_id, killer_id) {

        if (!(killer_id in this.clients)) { return; }
        var userid = clients[killer_id].userid;

        $.get('/game/' + userid + '/GalaxyRatingAdd?secret=sercet');
    }
}
ws.initialize();


/* Web Server */
var engine = require('engine.io');
var server = engine.listen(port, function () {
    console.log('Server is listening on port ' + port);
});

server.pingInterval = 10000;
server.pingTimeout = 25000;

function originIsAllowed(origin) {
    return true;
}

var userTricks = 0;
var clients = ws.clients;

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

    socket.isDisconnected = false;

    var ipaddress = socket.transport.request.headers['x-forwarded-for'];
    if (!ipaddress)
        ipaddress = socket.transport.request.connection.remoteAddress;

    $.get('/User/InfoBySID?sid=' + sid + '&ipAddress=' + ipaddress, function (result) {

        if (!result || !result.IsSuccess || !result.UserID || socket.isDisconnected) {
            return;
        }

        socket.send(JSON.stringify({ type: Game.MSG_LOGIN_SUCCESS, user: result }));

        var connection = socket; //request.accept(null, request.origin);
        connection.userid = result.UserID;
        connection.nick = result.Nick;
        connection.clientid = result.UserID; //Math.random().toString().replace("0.", "");
        var oldClient = clients[connection.clientid];
        if (oldClient) {
            console.log('[Reconnect]', oldClient.clientid);
            oldClient.close();
            disconnect(oldClient);
        }

        clients[connection.clientid] = connection;

        console.log(Date.now(), '[connect]')
        ws.gameServer.onconnect(connection.clientid, socket.transport.request.headers);

        connection.on('message', function (message) {
            if (process.env.ENV != 'production') {
                //console.log('Received Message: ' + message);
            }

            ws.gameServer.onmessage.call(ws.gameServer, connection.clientid, message, connection.nick);
        });
    }, true);



    socket.on('close', function (reasonCode, description) {
        //console.log('[close]', reasonCode, description);
        disconnect(socket);
    });

    socket.on('error', function (err) {
        //console.log('[Error]', err);
        disconnect(socket);
    });


    function disconnect(conn) {
        if (conn.isDisconnected) return;

        conn.isDisconnected = true;

        if (conn.clientid in clients) {
            delete clients[conn.clientid];
        }

        if (process.env.ENV != 'production') {
            //console.log(Date.now(), '[Disconnect] Peer ' + conn.clientid + ' disconnected.');
        }
        ws.gameServer.ondisconnect(conn.clientid, '', '');
    }
});

// ws.gameServer.onconnect(connection.clientid, request.httpRequest.headers);
// ws.gameServer.onmessage(connection.clientid, message.utf8Data);
// ws.gameServer.ondisconnect(connection.clientid, '', '');




