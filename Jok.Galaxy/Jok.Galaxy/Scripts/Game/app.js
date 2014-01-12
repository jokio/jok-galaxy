
// process.env.ENV = 'production';

var Game = require('./app.init').Game
var urlParser = require('url');
var http = require('http');



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

//var WebSocketServer = require('websocket').server;
//var static = require('node-static');
//var file = new(static.Server)('./');


//server = require('http').createServer(function(req, res) {

//    req.on('data', function(data) {
//    })

//    req.on('end', function() {
//        //file.serve(req, res);
//    })
//});
//server.listen(port, function() {
//    console.log((new Date()) + ' Server is listening on port '+port);
//});

//wsServer = new WebSocketServer({
//    httpServer: server,
//    // You should not use autoAcceptConnections for production
//    // applications, as it defeats all standard cross-origin protection
//    // facilities built into the protocol and the browser.  You should
//    // *always* verify the connection's origin and decide whether or not
//    // to accept it.
//    autoAcceptConnections: false
//});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

var userTricks = 0;
var clients = [];

server.on('connection', function (socket) {

    var connection = socket; //request.accept(null, request.origin);

    if (process.env.ENV != 'production') {
        // console.log(JSON.stringify(request.requestedProtocols));
        // console.log(JSON.stringify(request.requestedExtensions));
        // console.log((new Date()) + ' Connection accepted.');
    }

    var isDisconnected = false;



    connection.userid = 1;
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

server.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    if (!ws.isInitialized) {
        request.reject();
        console.log('ws not initialized yet!');
        return;
    }

    var sid;

    try {
        sid = urlParser.parse(request.httpRequest.url, true).query.sid;
    }
    catch (err) { }

    if (!sid) {
        request.reject();
        return;
    }

    $.get('/user/' + sid + '/getinfo?gameid=10&ipaddress=' + request.remoteAddress, function (result) {
        if (!result || !result.IsSuccess) {
            request.reject();
            return;
        }

        var connection = request.accept(null, request.origin);

        if (process.env.ENV != 'production') {
            // console.log(JSON.stringify(request.requestedProtocols));
            // console.log(JSON.stringify(request.requestedExtensions));
            // console.log((new Date()) + ' Connection accepted.');
        }

        var isDisconnected = false;



        connection.userid = result.UserID;
        connection.clientid = Math.random().toString().replace("0.", "");
        clients[connection.clientid] = connection;

        ws.gameServer.onconnect(connection.clientid, request.httpRequest.headers);


        connection.on('message', function (message) {
            if (message.type === 'utf8') {
                if (process.env.ENV != 'production') {
                    console.log('Received Message: ' + message.utf8Data);
                }

                // connection.sendUTF(message.utf8Data);

                ws.gameServer.onmessage(connection.clientid, message.utf8Data);
            }
            // else if (message.type === 'binary') {
            //     console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            //     connection.sendBytes(message.binaryData);
            // }

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
    })
});





// ws.gameServer.onconnect(connection.clientid, request.httpRequest.headers);

// ws.gameServer.onmessage(connection.clientid, message.utf8Data);

// ws.gameServer.ondisconnect(connection.clientid, '', '');




