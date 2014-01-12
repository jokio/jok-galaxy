Game.Multi = OZ.Class().extend(Game.Client);

Game.Multi.prototype.init = function (name, shipOptions, url, id) {
    Game.Client.prototype.init.call(this, name, shipOptions, id);

    this._player.setIdle(false);
    this._socket = null;
    this._url = url;
    this._control = {
        torque: {}
    }

    OZ.Event.add(this._keyboard, "keyboard-change", this._keyboardChange.bind(this));
}

Game.Multi.prototype.start = function () {
    Game.Client.prototype.start.call(this);

    this._socket = new eio.Socket(this._url, { transports: ['polling'] }); //new(window.WebSocket || window.MozWebSocket)(this._url);
    OZ.Event.add(this._socket, "open", this._open.bind(this));
    OZ.Event.add(this._socket, "close", this._close.bind(this));
    OZ.Event.add(this._socket, "message", this._message.bind(this));
}

Game.Multi.prototype._close = function (e) {
    this._keyboard.setControl(null);
    if (this._player._ship)
        this._player._ship.die();

    var _this = this;
    setTimeout(function () {
        _this.start();
    }, 2000)

    if (this.pingInterval)
        clearInterval(this.pingInterval);
}

Game.Multi.prototype._open = function (e) {
    //this._player.setIdle(true); /* allow creation of player's ship */

    ///* send CREATE_PLAYER */
    //var player = this._player;
    //var data = {};
    //data[player.getId()] = {
    //    name: player.getName(),
    //    score: player.getScore(),
    //    shipOptions: player.getShipOptions()
    //}

    //this._send(Game.MSG_CREATE_PLAYER, data);
}

Game.Multi.prototype._message = function (e) {

    var data = JSON.parse(e);
    var currentPlayer = this._player;
    var currentDate = new Date();

    switch (data.type) {
        case Game.MSG_LOGIN_SUCCESS:
            this._player.setIdle(true); /* allow creation of player's ship */

            /* send CREATE_PLAYER */
            var player = this._player;
            var data = {};
            data[player.getId()] = {
                name: player.getName(),
                score: player.getScore(),
                shipOptions: player.getShipOptions()
            }

            this._send(Game.MSG_CREATE_PLAYER, data);

            var _this = this;
            this.pingInterval = setInterval(function () {
                _this._send(Game.MSG_PING, Date.now(), true);
            }, 3000);
            break;

        case Game.MSG_SYNC:
        case Game.MSG_CHANGE:
            for (var id in data.data) {
                var playerData = data.data[id];
                var player = this._players[id];
                if (!player) {
                    console.warn("[change/sync] player " + id + " not available");
                    continue;
                }

                var ship = player.getShip();
                if (!ship) {
                    console.warn("[change/sync] player " + player.getName() + " does not have a ship");
                    continue;
                }

                var isCurrentPlayer = false;
                if (data.type == Game.MSG_SYNC) {

                    isCurrentPlayer = (currentPlayer == player);

                    //if (false)
                    //    // && (currentPlayer.lastUpdateTime && currentDate - currentPlayer.lastUpdateTime < 10000)) 
                    //{
                    //    continue;
                    //}

                    //currentPlayer.lastUpdateTime = currentDate;
                }

                this._mergeShip(ship, playerData, isCurrentPlayer);
            }
            break;

        case Game.MSG_CREATE_PLAYER:
            for (var id in data.data) {
                var playerData = data.data[id];
                if (id in this._players) {
                    if (id != this._player.getId()) {
                        console.warn("[create player] " + id + " already exists");
                    }
                    continue;
                }

                var player = this._addPlayer(Player, playerData.name, id, playerData.score);
                player.setShipOptions(playerData.shipOptions);
            }
            break;

        case Game.MSG_CREATE_SHIP:
            for (var id in data.data) {
                var playerData = data.data[id];
                var player = this._players[id];
                if (!player) {
                    console.warn("[create ship] player " + id + " not available");
                    continue;
                }

                if (player.getShip()) {
                    if (player != this._player) {
                        console.warn("[create ship] player " + player.getName() + " already has a ship");
                    }
                    continue;
                }

                var ship = player.createShip();
                this._mergeShip(ship, playerData);
            }

            break;

        case Game.MSG_DESTROY_SHIP:
            var enemy = null;
            var player = this._players[data.data.target];
            if (!player) {
                console.warn("[destroy ship] player " + data.data.target + " does not exist");
                break;
            }
            var ship = player.getShip();
            if (!ship) {
                console.warn("[destroy ship] player " + player.getName() + " does not have a ship");
                break;
            }

            if (data.data.enemy) {
                var enemy = this._players[data.data.enemy];
                if (!enemy) {
                    console.warn("[destroy ship] enemy " + data.data.enemy + " does not exist");
                    break;
                }
            }

            ship.die(enemy);
            break;

        case Game.MSG_DESTROY_PLAYER:
            var player = this._players[data.data];
            if (!player) {
                console.warn("[destroy player] player " + data.data + " does not exist");
                break;
            }
            this._removePlayer(player.getId());
            break;

        case Game.MSG_PONG:

            var latency = Date.now() - data.data;
            if (this._avgLatency)
                this._avgLatency = Math.round((this._avgLatency + latency) / 2);
            else
                this._avgLatency = latency;

            console.log('Latency', latency, this._avgLatency);
            break;

        default:
            console.warn("Unknown message type " + data.type);
            break;
    }
}

Game.Multi.prototype._send = function (type, data, preventSimluation) {
    var obj = {
        type: type,
        data: data
    }

    var objString = JSON.stringify(obj);

    this._socket.send(objString);
    if (preventSimluation) return;

    this._message(objString);
}

Game.Multi.prototype._keyboardChange = function (e) {
    var data = {};
    data[this._player.getId()] = {
        control: this._control
    };

    // თუ ნავიგაციის ცვლილებაა, მაშინ კოორდინატებიც უნდა გაეგზავნოს და დაკორექტირდეს სერვერზე
    if (e.data.isNavigationChange) {
        data[this._player.getId()].phys = this._player._ship._phys;
    }

    this._send(Game.MSG_CHANGE, data);
}

/**
 * Merge ship data with existing ship
 */
Game.Multi.prototype._mergeShip = function (ship, data, isCurrentPlayer) {
    var diff = 0;

    if (!isCurrentPlayer) {
        if (data.control) {
            var control = ship.getControl();
            for (var p in data.control) { control[p] = data.control[p]; }
        }
        if (data.phys) {
            var phys = ship.getPhys();
            for (var p in data.phys) {
                /*
                if (p == "position") {
                    var dx = data.phys[p][0] - phys[p][0];
                    var dy = data.phys[p][1] - phys[p][1];
                    diff += Math.sqrt(dx*dx+dy*dy);
                }
                */
                phys[p] = data.phys[p];
            }
        }
    }

    if (data.hp) {
        ship.setRemoteHP(data.hp);
    }

    if (diff) { console.info("Total position diff " + diff); }
}

Game.Multi.prototype._shipCreate = function (e) {
    e.target.setHP(1 / 0); /* ships are indestructible, until the server says otherwise */

    if (e.target.getPlayer() == this._player) { /* player's ship */
        this._keyboard.setControl(this._control);

        /* send CREATE_SHIP of player's ship */
        var player = this._player;
        var data = {};
        data[player.getId()] = {
            phys: e.target.getPhys()
        }

        this._send(Game.MSG_CREATE_SHIP, data, 1);
    }
}

Game.Multi.prototype._shipDeath = function (e) {
    if (e.target.getPlayer() == this._player) {
        this._keyboard.setControl(null);
        this._control = {
            torque: {}
        }
    }
}
