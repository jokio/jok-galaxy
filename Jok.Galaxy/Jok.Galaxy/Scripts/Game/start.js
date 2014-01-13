var user = undefined;

var ui = {

	play: function() {

		var self = this;

		$('#jok').hide();
		$('#Loading').show();

		var onProgress = function () {
	        $('#Loading').find('span.percentage').html(preload.progress * 100 | 0);
	    }

	    var onComplete = function () {
	        if (loadingInterval)
	            clearInterval(loadingInterval);

	        $('#Loading').fadeTo('normal', 0, function () {
	            $('#Loading').hide();
	            $('#jok').show('fast');
				self._playInternal();
	        });
	    }

	    var name1 = ['Feiyan', 'Gaalian', 'Maloc', 'Peleng', 'People'];
	    var name2 = ['Liner', 'Pirate', 'Ranger'];

	    var manifest = [];

	    for (var i = 0; i < name1.length; i++) {
	    	for (var j = 0; j < name2.length; j++) {

	    		var id = name1[i] + '_' + name2[j] + '_64';

	    		manifest.push({
	    			id: id,
	    			src: '/images/ships/' + id + '.png'
	    		})
	    	}
	    }

	    manifest.push({
			id: 'explosion_128',
			src: '/images/explosion_128.png'
		});

	    manifest.push({
			id: 'plasma-red',
			src: '/images/plasma-red.png'
		});

	    manifest.push({
			id: 'plasma-white',
			src: '/images/plasma-white.png'
		});

	    manifest.push({
			id: 'plasma-yellow',
			src: '/images/plasma-yellow.png'
		});


	    var preload = new createjs.PreloadJS();
	    preload.onComplete = onComplete;
	    preload.loadManifest(manifest);

	    var loadingInterval = setInterval(onProgress, 200);
	},

	_playInternal: function() {
		// OZ.DOM.clear(document.body);

		var game = null;
		var ship = {
			color: $.cookie('galaxy-shipcolor') || ((new Date().getMilliseconds() % 2) == 1 ? 'red' : 'yellow'),
			type: $.cookie('galaxy-shiptype') || 1,
			weaponType: 0
		};

		var url = 'ws://galaxy-server-eu.jok.io:80';
		//var url = 'ws://localhost:9003';

		game = new Game.Multi(jok.config.nick, ship, url, jok.config.userID);
		game.start();
		
		window.g = game;
	}
}

$(function() {

	/* Authorization */
	var sid = $.cookie('sid');

	if (!sid) {
		console.log(window.location.search)
		if (!window.location.search) {
			window.location.assign(jok.config.authorizationUrl);
			return;
		}

		var query = window.location.search.replace('?', '').split('=');
		console.log(query)
		if (query.length >= 2 && query[0] == 'sid') {
			sid = query[1];
			$.cookie('sid', sid, { expires: 7 });
		}
		else {
			window.location.assign(jok.config.authorizationUrl);
			return;
		}
	}

	if (!sid) {
		window.location.assign(jok.config.authorizationUrl);
		return;
	}

	ui.play();

	// var redirectToGetSID = function() {
	// 	console.log('redirect')
	// 	// window.location.assign('http://old.jok.ge/node/getsid?returnurl=' + window.location.origin);
	// }

	// if (!sid) {
	// 	console.log(window.location.search)
	// 	if (!window.location.search) {
	// 		redirectToGetSID();
	// 		return;
	// 	}

	// 	var query = window.location.search.replace('?', '').split('=');
	// 	console.log(query)
	// 	if (query.length >= 2 && query[0] == 'sid') {
	// 		sid = query[1];
	// 		$.cookie('sid', sid, { expires: 7 });
	// 	}
	// 	else {
	// 		redirectToGetSID();
	// 		return;
	// 	}
	// }

	// $.get('http://old.jok.ge/node/userinfo/' + sid, function(data) {
	// 	// if (!data.isSuccess)
	// 	// 	window.location.assign('http://jok.ge/joinus?returnUrl=http://galaxy.jok.fm');

	// 	user = data.user;
		
	// 	ui.play();
	// })
});
