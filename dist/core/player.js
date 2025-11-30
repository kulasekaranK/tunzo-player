"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const rxjs_1 = require("rxjs");
const background_mode_1 = require("@capacitor-community/background-mode");
const keep_awake_1 = require("@capacitor-community/keep-awake");
class Player {
    /** Initialize with playlist and quality */
    static initialize(playlist, quality = 3) {
        this.playlist = playlist;
        this.selectedQuality = quality;
        this.setupMediaSession();
        this.configureBackgroundMode();
    }
    /** Call this once on user gesture to unlock audio in WebView */
    static unlockAudio() {
        this.audio.src = '';
        this.audio.load();
        this.audio.play().catch(() => { });
    }
    //updated
    static play(song, index = 0) {
        var _a;
        if (!song || !song.downloadUrl)
            return;
        this.currentSong = song;
        this.currentIndex = index;
        let url = ((_a = song.downloadUrl[this.selectedQuality]) === null || _a === void 0 ? void 0 : _a.url) || '';
        // 🚀 Auto-convert http → https
        if (url.startsWith('http://')) {
            url = url.replace('http://', 'https://');
        }
        this.audio.src = url;
        // @ts-ignore
        this.audio.title = song.name || song.title || 'Unknown Title'; // Help some browsers identify the track
        this.audio.preload = 'auto'; // Improve loading
        this.audio.load(); // Ensure audio is loaded before play
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updateMediaSessionMetadata(song);
            this.enableBackgroundMode();
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        }).catch((err) => {
            this.isPlaying = false;
            console.warn('Audio play failed:', err);
        });
        // Set duration
        this.audio.onloadedmetadata = () => {
            this.duration = this.audio.duration;
            this.updatePositionState();
        };
        // Set current time
        this.audio.ontimeupdate = () => {
            this.currentTime = this.audio.currentTime;
            // Update position state less frequently to avoid spamming, but enough to keep sync
            if (Math.floor(this.currentTime) % 5 === 0) {
                this.updatePositionState();
            }
        };
        // Handle buffering/stalled states
        this.audio.onwaiting = () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'none'; // Or 'paused' to indicate buffering
            }
        };
        this.audio.onplaying = () => {
            this.isPlaying = true;
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        };
        // Auto-play next song
        this.audio.onended = () => {
            this.autoNext();
        };
        // Catch errors
        this.audio.onerror = (e) => {
            console.error('Audio error:', this.audio.error, e);
        };
    }
    static pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.disableBackgroundMode();
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    }
    static resume() {
        this.audio.play();
        this.isPlaying = true;
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
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
            this.queue$.next([...this.queue]);
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
        this.updatePositionState();
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
    static getShuffleStatus() {
        return this.isShuffle;
    }
    static addToQueue(song) {
        if (!this.queue.some(q => q.id === song.id)) {
            this.queue.push(song);
            this.queue$.next([...this.queue]);
        }
    }
    static removeFromQueue(index) {
        this.queue.splice(index, 1);
        this.queue$.next([...this.queue]);
    }
    static reorderQueue(from, to) {
        const item = this.queue.splice(from, 1)[0];
        this.queue.splice(to, 0, item);
        this.queue$.next([...this.queue]);
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
    // -------------------------------------------------------------------------
    // Capacitor Background Mode & Keep Awake
    // -------------------------------------------------------------------------
    static configureBackgroundMode() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Enable background mode
                yield background_mode_1.BackgroundMode.enable();
                // Android specific settings
                yield background_mode_1.BackgroundMode.setSettings({
                    title: "Tunzo Player",
                    text: "Playing music in background",
                    icon: "ic_launcher",
                    color: "042730",
                    resume: true,
                    hidden: false,
                    bigText: true
                });
            }
            catch (err) {
                console.warn('Background Mode plugin not available:', err);
            }
        });
    }
    static enableBackgroundMode() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield keep_awake_1.KeepAwake.keepAwake();
                yield background_mode_1.BackgroundMode.enable();
                // On Android, this moves the app to a foreground service state
                yield background_mode_1.BackgroundMode.moveToForeground();
            }
            catch (err) {
                // Plugin might not be installed or on web
            }
        });
    }
    static disableBackgroundMode() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield keep_awake_1.KeepAwake.allowSleep();
                // We might want to keep background mode enabled if we want to resume later,
                // but for battery saving, we can disable it or move to background.
                // await BackgroundMode.disable(); 
                yield background_mode_1.BackgroundMode.moveToBackground();
            }
            catch (err) {
                // Plugin might not be installed or on web
            }
        });
    }
    // -------------------------------------------------------------------------
    // Native Media Session (Lock Screen Controls)
    // -------------------------------------------------------------------------
    static setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.resume());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined) {
                    this.seek(details.seekTime);
                }
            });
        }
    }
    static updateMediaSessionMetadata(song) {
        var _a;
        if ('mediaSession' in navigator) {
            const artwork = [];
            if (song.image) {
                if (Array.isArray(song.image)) {
                    // Assuming image array contains objects with url/link and quality
                    song.image.forEach((img) => {
                        let src = img.link || img.url || (typeof img === 'string' ? img : '');
                        if (src) {
                            // 🚀 Auto-convert http → https for images too
                            if (src.startsWith('http://')) {
                                src = src.replace('http://', 'https://');
                            }
                            artwork.push({ src, sizes: '500x500', type: 'image/jpeg' });
                        }
                    });
                }
                else if (typeof song.image === 'string') {
                    let src = song.image;
                    if (src.startsWith('http://')) {
                        src = src.replace('http://', 'https://');
                    }
                    artwork.push({ src: src, sizes: '500x500', type: 'image/jpeg' });
                }
            }
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.name || song.title || 'Unknown Title',
                artist: song.primaryArtists || song.artist || 'Unknown Artist',
                album: ((_a = song.album) === null || _a === void 0 ? void 0 : _a.name) || song.album || 'Unknown Album',
                artwork: artwork.length > 0 ? artwork : undefined
            });
        }
    }
    static updatePositionState() {
        if ('mediaSession' in navigator && this.duration > 0) {
            navigator.mediaSession.setPositionState({
                duration: this.duration,
                playbackRate: this.audio.playbackRate,
                position: this.audio.currentTime
            });
        }
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
Player.queue$ = new rxjs_1.BehaviorSubject([]);
Player.playlist = [];
Player.selectedQuality = 3;
