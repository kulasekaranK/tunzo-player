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
const capacitor_media_session_1 = require("@capgo/capacitor-media-session");
class Player {
    /** Initialize with playlist and quality */
    static initialize(playlist, quality = 3) {
        this.playlist = playlist;
        this.selectedQuality = quality;
        this.setupMediaSession();
        this.setupAudioElement();
    }
    static setToastController(controller) {
        this.toastCtrl = controller;
    }
    /** Setup audio element for better compatibility */
    static setupAudioElement() {
        // Enable background playback
        this.audio.preload = 'auto';
        // @ts-ignore - Some browsers support this
        this.audio.preservesPitch = false;
        // Setup event listeners
        this.audio.onloadedmetadata = () => {
            this.duration = this.audio.duration;
            this.updatePositionState();
        };
        this.audio.ontimeupdate = () => {
            this.currentTime = this.audio.currentTime;
            if (Math.floor(this.currentTime) % 5 === 0) {
                this.updatePositionState();
            }
        };
        this.audio.onended = () => {
            this.autoNext();
        };
        this.audio.onplaying = () => {
            this.isPlaying = true;
            capacitor_media_session_1.MediaSession.setPlaybackState({ playbackState: 'playing' });
        };
        this.audio.onpause = () => {
            this.isPlaying = false;
            capacitor_media_session_1.MediaSession.setPlaybackState({ playbackState: 'paused' });
        };
        this.audio.onwaiting = () => {
            capacitor_media_session_1.MediaSession.setPlaybackState({ playbackState: 'none' });
        };
        this.audio.onerror = (e) => {
            console.error('Audio error:', this.audio.error, e);
            this.isPlaying = false;
            capacitor_media_session_1.MediaSession.setPlaybackState({ playbackState: 'none' });
        };
    }
    /** Call this once on user gesture to unlock audio in WebView */
    static unlockAudio() {
        this.audio.src = '';
        this.audio.load();
        this.audio.play().catch(() => { });
    }
    static play(song_1) {
        return __awaiter(this, arguments, void 0, function* (song, index = 0) {
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
            // Update metadata before playing to ensure UI is ready
            yield this.updateMediaSessionMetadata(song);
            try {
                this.audio.src = url;
                this.audio.load();
                yield this.audio.play();
                this.isPlaying = true;
                yield capacitor_media_session_1.MediaSession.setPlaybackState({ playbackState: 'playing' });
            }
            catch (err) {
                // Ignore AbortError (happens when play is interrupted by another play call)
                if (err.name !== 'AbortError') {
                    console.warn('Audio play failed:', err);
                    this.isPlaying = false;
                    yield capacitor_media_session_1.MediaSession.setPlaybackState({ playbackState: 'paused' });
                }
            }
        });
    }
    static pause() {
        return __awaiter(this, void 0, void 0, function* () {
            this.audio.pause();
            this.isPlaying = false;
            yield capacitor_media_session_1.MediaSession.setPlaybackState({ playbackState: 'paused' });
        });
    }
    static resume() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.audio.play();
                this.isPlaying = true;
                yield capacitor_media_session_1.MediaSession.setPlaybackState({ playbackState: 'playing' });
            }
            catch (err) {
                console.warn('Resume failed:', err);
            }
        });
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
        else {
            // End of playlist
            this.isPlaying = false;
            capacitor_media_session_1.MediaSession.setPlaybackState({ playbackState: 'paused' });
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
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.queue.some(q => q.id === song.id)) {
                this.queue.push(song);
                this.queue$.next([...this.queue]);
                if (this.toastCtrl) {
                    const toast = yield this.toastCtrl.create({
                        message: 'Song added to queue',
                        duration: 2000,
                        position: 'bottom',
                        mode: 'ios',
                        color: 'dark',
                        cssClass: 'custom-toast'
                    });
                    yield toast.present();
                }
            }
        });
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
    // Native Media Session (Lock Screen Controls)
    // -------------------------------------------------------------------------
    static setupMediaSession() {
        return __awaiter(this, void 0, void 0, function* () {
            yield capacitor_media_session_1.MediaSession.setActionHandler({ action: 'play' }, () => this.resume());
            yield capacitor_media_session_1.MediaSession.setActionHandler({ action: 'pause' }, () => this.pause());
            yield capacitor_media_session_1.MediaSession.setActionHandler({ action: 'previoustrack' }, () => this.prev());
            yield capacitor_media_session_1.MediaSession.setActionHandler({ action: 'nexttrack' }, () => this.next());
            yield capacitor_media_session_1.MediaSession.setActionHandler({ action: 'seekto' }, (details) => {
                const time = details.seekTime;
                if (typeof time === 'number') {
                    this.seek(time);
                }
            });
        });
    }
    static updateMediaSessionMetadata(song) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Extract artwork from image array
            const artwork = [];
            if (song.image && Array.isArray(song.image)) {
                // Get the highest quality image (last in array, usually 500x500)
                const highQualityImage = song.image[song.image.length - 1];
                if (highQualityImage && highQualityImage.url) {
                    let src = highQualityImage.url;
                    if (src.startsWith('http://')) {
                        src = src.replace('http://', 'https://');
                    }
                    // Skip placeholder images
                    if (!src.includes('_i/share-image')) {
                        artwork.push({
                            src,
                            sizes: highQualityImage.quality || '500x500',
                            type: 'image/jpeg'
                        });
                    }
                }
            }
            // Extract artist name from artists.primary array
            let artistName = 'Unknown Artist';
            if (((_a = song.artists) === null || _a === void 0 ? void 0 : _a.primary) && Array.isArray(song.artists.primary) && song.artists.primary.length > 0) {
                artistName = song.artists.primary.map((artist) => artist.name).join(', ');
            }
            else if (song.primaryArtists) {
                artistName = song.primaryArtists;
            }
            else if (song.artist) {
                artistName = song.artist;
            }
            yield capacitor_media_session_1.MediaSession.setMetadata({
                title: song.name || song.title || 'Unknown Title',
                artist: artistName,
                album: ((_b = song.album) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown Album',
                artwork: artwork.length > 0 ? artwork : undefined
            });
        });
    }
    static updatePositionState() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.duration > 0) {
                yield capacitor_media_session_1.MediaSession.setPositionState({
                    duration: this.duration,
                    playbackRate: this.audio.playbackRate,
                    position: this.audio.currentTime
                });
            }
        });
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
