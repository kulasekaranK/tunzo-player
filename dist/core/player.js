"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    /** Initialize with playlist and quality */
    static initialize(playlist, quality = 3) {
        this.playlist = playlist;
        this.selectedQuality = quality;
    }
    /** Call this once on user gesture to unlock audio in WebView */
    static unlockAudio() {
        this.audio.src = '';
        this.audio.load();
        this.audio.play().catch(() => { });
    }
    static play(song, index = 0) {
        var _a;
        if (!song || !song.downloadUrl)
            return;
        this.currentSong = song;
        this.currentIndex = index;
        this.audio.src = ((_a = song.downloadUrl[this.selectedQuality]) === null || _a === void 0 ? void 0 : _a.url) || '';
        this.audio.load(); // Ensure audio is loaded before play
        this.audio.play().then(() => {
            this.isPlaying = true;
        }).catch((err) => {
            // Handle play errors (autoplay, WebView restrictions)
            this.isPlaying = false;
            console.warn('Audio play failed:', err);
        });
        // Set duration
        this.audio.onloadedmetadata = () => {
            this.duration = this.audio.duration;
        };
        // Set current time
        this.audio.ontimeupdate = () => {
            this.currentTime = this.audio.currentTime;
        };
        // Auto-play next song
        this.audio.onended = () => {
            this.autoNext();
        };
    }
    static pause() {
        this.audio.pause();
        this.isPlaying = false;
    }
    static resume() {
        this.audio.play();
        this.isPlaying = true;
    }
    static togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        }
        else {
            this.resume();
        }
    }
    static next() {
        if (this.queue.length > 0) {
            const nextQueued = this.queue.shift();
            const index = this.playlist.findIndex(s => s.id === nextQueued.id);
            this.play(nextQueued, index);
        }
        else if (this.isShuffle) {
            this.playRandom();
        }
        else if (this.currentIndex < this.playlist.length - 1) {
            this.play(this.playlist[this.currentIndex + 1], this.currentIndex + 1);
        }
    }
    static prev() {
        if (this.currentIndex > 0) {
            this.play(this.playlist[this.currentIndex - 1], this.currentIndex - 1);
        }
    }
    static seek(seconds) {
        this.audio.currentTime = seconds;
    }
    static autoNext() {
        this.next();
    }
    static playRandom() {
        if (this.playlist.length <= 1)
            return;
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.playlist.length);
        } while (randomIndex === this.currentIndex);
        this.play(this.playlist[randomIndex], randomIndex);
    }
    static toggleShuffle() {
        this.isShuffle = !this.isShuffle;
    }
    static addToQueue(song) {
        if (!this.queue.some(q => q.id === song.id)) {
            this.queue.push(song);
        }
    }
    static removeFromQueue(index) {
        this.queue.splice(index, 1);
    }
    static reorderQueue(from, to) {
        const item = this.queue.splice(from, 1)[0];
        this.queue.splice(to, 0, item);
    }
    static getCurrentTime() {
        return this.currentTime;
    }
    static getDuration() {
        return this.duration;
    }
    static formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    static isPlayingSong() {
        return this.isPlaying;
    }
    static getCurrentSong() {
        return this.currentSong;
    }
    static setQuality(index) {
        this.selectedQuality = index;
    }
    static getQueue() {
        return this.queue;
    }
    static getPlaylist() {
        return this.playlist;
    }
}
exports.Player = Player;
Player.audio = new Audio();
Player.currentSong = null;
Player.currentIndex = 0;
Player.isPlaying = false;
Player.currentTime = 0;
Player.duration = 0;
Player.isShuffle = true;
Player.queue = [];
Player.playlist = [];
Player.selectedQuality = 3;
