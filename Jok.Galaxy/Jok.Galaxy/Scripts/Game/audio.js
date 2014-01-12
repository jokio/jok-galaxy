Game.Audio = {
    _maxConcurentAudio: 5,
    _liveAudiosCache: {},
    _supported: !!window.Audio && !(navigator.userAgent.match(/linux/i) && navigator.userAgent.match(/firefox/i)),
    play: function (name) {
        if (!this._supported) { return; }
        if (this._liveAudiosCache[name] && this._liveAudiosCache[name].active > this._maxConcurentAudio) { return; }

        var currentTime = new Date();

        if (!this._liveAudiosCache[name]) {
            this._liveAudiosCache[name] = {
                active: 0,
                lastTime: currentTime
            };
        }
        else {
            if (currentTime - this._liveAudiosCache[name].lastTime < 200)
                return;

            this._liveAudiosCache[name].lastTime = currentTime;
        }

        var a = new Audio();
        var ext = (a.canPlayType("audio/ogg") ? "ogg" : "mp3");
        a.src = "/Audios/" + name + "." + ext;
        a.addEventListener('ended', (function () { this._liveAudiosCache[name].active--; }).bind(this));
        a.play();

        this._liveAudiosCache[name].active++;
    }
}
