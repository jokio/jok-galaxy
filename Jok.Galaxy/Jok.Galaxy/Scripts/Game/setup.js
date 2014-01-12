var user = undefined;

var ui = {
	selectedColor: undefined,
	selectedShip: undefined,
	init: function() {
		this.selectedColor = localStorage.color || Ship.random().color;
		this.selectedShip = typeof(localStorage.type) == "string" ? localStorage.type : 1;

		this.selectColor(this.selectedColor);
	},

	selectColor: function(color) {
		$('.shipcolors div').each(function(i) {
			if ($(this).attr('data-tag') == color) {
				$(this).attr('class', 'active');
			}
			else {
				$(this).attr('class', '');
			}
		});
		
		for (var i=0;i<Ship.types.length;i++) {
			var image = Ship.getImageName(color, i) + "_000.png";
			$($('.button-set').children()[i]).find('img').attr('src', image);
		}

		ui.selectedColor = color;
	},

	selectShip: function(index) {
		if (!user) return;
		if (!user.IsVIPMember) {
			var buttons = $('.button-set').children();
			$(buttons[0]).attr('class', 'disabled');
			$(buttons[1]).attr('class', 'active');
			$(buttons[2]).attr('class', 'disabled');
			this.selectedShip = 1;
			return;
		}

		$('.button-set').find('button').each(function(i) {
			if (i == index) {
				$(this).attr('class', 'active');
			}
			else {
				$(this).attr('class', '');
			}
		});

		ui.selectedShip = index;
	},

	play: function() {

		var self = this;

		$('#GameUI').hide();
		$('#Loading').show();

		var onProgress = function () {
	        $('#Loading').find('span.percentage').html(preload.progress * 100 | 0);
	    }

	    var onComplete = function () {
	        if (loadingInterval)
	            clearInterval(loadingInterval);

	        $('#Loading').fadeTo('normal', 0, function () {
	            $('#Loading').hide();
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
		OZ.DOM.clear(document.body);
		var game = null;
		var ship = {
			color: ui.selectedColor,
			type: ui.selectedShip,
			weaponType: 0
		};
		localStorage.color = ship.color;
		localStorage.type = ship.type;
		// localStorage.weapon = ship.weaponType;
		
		// if (OZ.DOM.hasClass(this._dom.single, "active")) {
			// var enemies = parseInt(this._dom.enemies.value) || 10;
			// console.log(enemies)
			// var enemies = 5 +  Math.round(12 * Math.random());
			// game = new Game.Single(user.Nick, ship, enemies);
			// localStorage.mode = "single";
		// } else {
			var url = "ws://" + location.hostname + ':9003';

			game = new Game.Multi(user.Nick, ship, url);
			// localStorage.mode = "multi";
		// }

	    var el = document.documentElement
	      , rfs =  el.requestFullScreen
	            || el.webkitRequestFullScreen
	            || el.mozRequestFullScreen;

	    // rfs.call(el);

		game.start();
		
		window.g = game;
	}
}


$('.jokge').live('click', function() {
	window.location.assign('http://jok.io');
});

$(function() {

	/* Authorization */
	var sid = $.cookie('sid');

	var redirectToGetSID = function() {
		console.log('redirect')
		// window.location.assign('http://old.jok.ge/node/getsid?returnurl=' + window.location.origin);
	}

	if (!sid) {
		console.log(window.location.search)
		if (!window.location.search) {
			redirectToGetSID();
			return;
		}

		var query = window.location.search.replace('?', '').split('=');
		console.log(query)
		if (query.length >= 2 && query[0] == 'sid') {
			sid = query[1];
			$.cookie('sid', sid, { expires: 7 });
		}
		else {
			redirectToGetSID();
			return;
		}
	}

	$.get('http://old.jok.ge/node/userinfo/' + sid, function(data) {
		// if (!data.isSuccess)
		// 	window.location.assign('http://jok.ge/joinus?returnUrl=http://galaxy.jok.fm');

		user = data.user;

		$('.play').show();

		var buttons = $('.button-set').children();

		if (!user.IsVIPMember) {
			ui.selectedShip = 1;

			$(buttons[0]).attr('class', 'disabled');
			$(buttons[1]).attr('class', 'disabled');
			$(buttons[2]).attr('class', 'disabled');

			$('.vip_only').show();
		} else {
			$(buttons[0]).attr('class', '');
			$(buttons[1]).attr('class', '');
			$(buttons[2]).attr('class', '');
		}

		ui.selectShip(ui.selectedShip);
	})


	/* Events */
	$('.shipcolors div').bind('click mouseenter touchstart', function() {
		var color = $(this).attr('data-tag');

		ui.selectColor(color);
	});

	$('.button-set button').click(function() {
		var index = $(this).attr('data-tag');
		
		ui.selectShip(index);
	});

	$('.play').click(function() {
		ui.play();
	})



	ui.init();
});
