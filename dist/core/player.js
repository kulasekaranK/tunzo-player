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
const keep_awake_1 = require("@capacitor-community/keep-awake");
class Player {
    /** Initialize with playlist and quality */
    static initialize(playlist, quality = 3) {
        this.playlist = playlist;
        this.selectedQuality = quality;
        this.setupMediaSession();
        this.setupAudioElement();
        this.startWatchdog();
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
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        };
        this.audio.onpause = () => {
            this.isPlaying = false;
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'paused';
            }
        };
        this.audio.onwaiting = () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'none';
            }
        };
        this.audio.onerror = (e) => {
            console.error('Audio error:', this.audio.error, e);
        };
    }
    static startWatchdog() {
        setInterval(() => {
            if (this.intendedPlaying && this.audio.paused && this.currentSong) {
                console.log('Watchdog: Audio paused unexpectedly. Attempting to resume...');
                this.audio.play().catch(e => console.warn('Watchdog resume failed:', e));
            }
        }, 10000);
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
        this.intendedPlaying = true;
        this.currentSong = song;
        this.currentIndex = index;
        let url = ((_a = song.downloadUrl[this.selectedQuality]) === null || _a === void 0 ? void 0 : _a.url) || '';
        // 🚀 Auto-convert http → https
        if (url.startsWith('http://')) {
            url = url.replace('http://', 'https://');
        }
        this.audio.src = url;
        this.audio.load();
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updateMediaSessionMetadata(song);
            keep_awake_1.KeepAwake.keepAwake(); // Keep screen/CPU awake
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
            }
        }).catch((err) => {
            this.isPlaying = false;
            console.warn('Audio play failed:', err);
        });
    }
    static pause() {
        this.intendedPlaying = false;
        this.audio.pause();
        this.isPlaying = false;
        keep_awake_1.KeepAwake.allowSleep();
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    }
    static resume() {
        this.intendedPlaying = true;
        this.audio.play();
        this.isPlaying = true;
        keep_awake_1.KeepAwake.keepAwake();
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
        else {
            this.intendedPlaying = false;
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
        var _a, _b;
        if ('mediaSession' in navigator) {
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
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.name || song.title || 'Unknown Title',
                artist: artistName,
                album: ((_b = song.album) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown Album',
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
Player.intendedPlaying = false;
