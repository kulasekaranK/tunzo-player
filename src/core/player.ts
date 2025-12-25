import { BehaviorSubject } from 'rxjs';
import { ToastController } from '@ionic/angular/standalone';
import { MediaSession } from '@capgo/capacitor-media-session';

export class Player {
  private static audio = new Audio();
  private static currentSong: any = null;
  private static currentIndex = 0;
  private static isPlaying = false;
  private static currentTime = 0;
  private static duration = 0;
  private static isShuffle = true;
  private static queue: any[] = [];
  static queue$ = new BehaviorSubject<any[]>([]);
  private static playlist: any[] = [];
  private static selectedQuality = 3;
  private static toastCtrl: ToastController;

  /** Initialize with playlist and quality */
  static initialize(playlist: any[], quality = 3) {
    this.playlist = playlist;
    this.selectedQuality = quality;
    this.setupMediaSession();
    this.setupAudioElement();
  }

  static setToastController(controller: ToastController) {
    this.toastCtrl = controller;
  }

  /** Setup audio element for better compatibility */
  private static setupAudioElement() {
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
      MediaSession.setPlaybackState({ playbackState: 'playing' });
    };

    this.audio.onpause = () => {
      this.isPlaying = false;
      MediaSession.setPlaybackState({ playbackState: 'paused' });
    };

    this.audio.onwaiting = () => {
      MediaSession.setPlaybackState({ playbackState: 'none' });
    };

    this.audio.onerror = (e) => {
      console.error('Audio error:', this.audio.error, e);
      this.isPlaying = false;
      MediaSession.setPlaybackState({ playbackState: 'none' });
    };
  }

  /** Call this once on user gesture to unlock audio in WebView */
  static unlockAudio() {
    this.audio.src = '';
    this.audio.load();
    this.audio.play().catch(() => { });
  }

  static async play(song: any, index: number = 0) {
    if (!song || !song.downloadUrl) return;

    this.currentSong = song;
    this.currentIndex = index;

    let url = song.downloadUrl[this.selectedQuality]?.url || '';

    // 🚀 Auto-convert http → https
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }

    // Update metadata before playing to ensure UI is ready
    await this.updateMediaSessionMetadata(song);

    try {
      this.audio.src = url;
      this.audio.load();
      await this.audio.play();
      this.isPlaying = true;
      await MediaSession.setPlaybackState({ playbackState: 'playing' });
    } catch (err: any) {
      // Ignore AbortError (happens when play is interrupted by another play call)
      if (err.name !== 'AbortError') {
        console.warn('Audio play failed:', err);
        this.isPlaying = false;
        await MediaSession.setPlaybackState({ playbackState: 'paused' });
      }
    }
  }

  static async pause() {
    this.audio.pause();
    this.isPlaying = false;
    await MediaSession.setPlaybackState({ playbackState: 'paused' });
  }

  static async resume() {
    try {
      await this.audio.play();
      this.isPlaying = true;
      await MediaSession.setPlaybackState({ playbackState: 'playing' });
    } catch (err) {
      console.warn('Resume failed:', err);
    }
  }

  static togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  static next() {
    if (this.queue.length > 0) {
      const nextQueued = this.queue.shift();
      this.queue$.next([...this.queue]);
      const index = this.playlist.findIndex(s => s.id === nextQueued.id);
      this.play(nextQueued, index);
    } else if (this.isShuffle) {
      this.playRandom();
    } else if (this.currentIndex < this.playlist.length - 1) {
      this.play(this.playlist[this.currentIndex + 1], this.currentIndex + 1);
    } else {
      // End of playlist
      this.isPlaying = false;
      MediaSession.setPlaybackState({ playbackState: 'paused' });
    }
  }

  static prev() {
    if (this.currentIndex > 0) {
      this.play(this.playlist[this.currentIndex - 1], this.currentIndex - 1);
    }
  }

  static seek(seconds: number) {
    this.audio.currentTime = seconds;
    this.updatePositionState();
  }

  static autoNext() {
    this.next();
  }

  static playRandom() {
    if (this.playlist.length <= 1) return;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * this.playlist.length);
    } while (randomIndex === this.currentIndex);
    this.play(this.playlist[randomIndex], randomIndex);
  }

  static toggleShuffle() {
    this.isShuffle = !this.isShuffle;
  }

  static getShuffleStatus(): boolean {
    return this.isShuffle;
  }

  static async addToQueue(song: any) {
    if (!this.queue.some(q => q.id === song.id)) {
      this.queue.push(song);
      this.queue$.next([...this.queue]);

      if (this.toastCtrl) {
        const toast = await this.toastCtrl.create({
          message: 'Song added to queue',
          duration: 2000,
          position: 'bottom',
          mode: 'ios',
          color: 'dark',
          cssClass: 'custom-toast'
        });
        await toast.present();
      }
    }
  }

  static removeFromQueue(index: number) {
    this.queue.splice(index, 1);
    this.queue$.next([...this.queue]);
  }

  static reorderQueue(from: number, to: number) {
    const item = this.queue.splice(from, 1)[0];
    this.queue.splice(to, 0, item);
    this.queue$.next([...this.queue]);
  }

  static getCurrentTime(): number {
    return this.currentTime;
  }

  static getDuration(): number {
    return this.duration;
  }

  static formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  static isPlayingSong(): boolean {
    return this.isPlaying;
  }

  static getCurrentSong(): any {
    return this.currentSong;
  }

  static setQuality(index: number) {
    this.selectedQuality = index;
  }

  static getQueue(): any[] {
    return this.queue;
  }

  static getPlaylist(): any[] {
    return this.playlist;
  }

  // -------------------------------------------------------------------------
  // Native Media Session (Lock Screen Controls)
  // -------------------------------------------------------------------------

  private static async setupMediaSession() {
    await MediaSession.setActionHandler({ action: 'play' }, () => this.resume());
    await MediaSession.setActionHandler({ action: 'pause' }, () => this.pause());
    await MediaSession.setActionHandler({ action: 'previoustrack' }, () => this.prev());
    await MediaSession.setActionHandler({ action: 'nexttrack' }, () => this.next());
    await MediaSession.setActionHandler({ action: 'seekto' }, (details) => {
      const time = details.seekTime;
      if (typeof time === 'number') {
        this.seek(time);
      }
    });
  }

  private static async updateMediaSessionMetadata(song: any) {
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
    if (song.artists?.primary && Array.isArray(song.artists.primary) && song.artists.primary.length > 0) {
      artistName = song.artists.primary.map((artist: any) => artist.name).join(', ');
    } else if (song.primaryArtists) {
      artistName = song.primaryArtists;
    } else if (song.artist) {
      artistName = song.artist;
    }

    await MediaSession.setMetadata({
      title: song.name || song.title || 'Unknown Title',
      artist: artistName,
      album: song.album?.name || 'Unknown Album',
      artwork: artwork.length > 0 ? artwork : undefined
    });
  }

  private static async updatePositionState() {
    if (this.duration > 0) {
      await MediaSession.setPositionState({
        duration: this.duration,
        playbackRate: this.audio.playbackRate,
        position: this.audio.currentTime
      });
    }
  }
}
