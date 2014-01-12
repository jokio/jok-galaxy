
var fs = require('fs')

/* mininal DOM environment */
var nullElm = {
    style: {},
    appendChild: function () { },
    getContext: function () { }
}
var window = {};
var location = {};
var document = {
    createElement: function () { return nullElm; }
};

var navigator = { userAgent: "" };
var createjs = {};
global.setTimeout = function () { };

/* read all javascript files */
//var html = fs.readFileSync(__dirname + '/index.html', 'utf-8');

var scripts = [
    'oz.js',
    'haf.js',
    'game.js',
    'game.client.js',
    'game.single.js',
    'game.multi.js',
    'game.server.js',
    'audio.js',
    'keyboard.js',
    'player.js',
    'player.ai.js',
    'player.human.js',
    'ship.js',
    'ship.mini.js',
    'background.js',
    'map.js',
    'explosion.js',
    'weapon.js',
    'weapon.projectile.js',
    'label.js',
    'score.js'
];

var totalScript = '';
for (var i = 0; i < scripts.length; i++) {

    console.log('loading: ' + scripts[i]);

    try {
        var scr = fs.readFileSync(__dirname + "/" + scripts[i], 'utf-8');
        totalScript += scr;
        eval(scr);
    } catch (e) {
        console.log(e);
    }
}
/* */

HAF.Engine.prototype.draw = function () { }


exports.Game = Game;
exports.Player = Player;