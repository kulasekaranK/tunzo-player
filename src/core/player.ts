import { BehaviorSubject } from 'rxjs';

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

  /** Initialize with playlist and quality */
  static initialize(playlist: any[], quality = 3) {
    this.playlist = playlist;
    this.selectedQuality = quality;
    this.setupMediaSession();
  }

  /** Call this once on user gesture to unlock audio in WebView */
  static unlockAudio() {
    this.audio.src = '';
    this.audio.load();
    this.audio.play().catch(() => { });
  }
  //updated

  static play(song: any, index: number = 0) {
    if (!song || !song.downloadUrl) return;

    this.currentSong = song;
    this.currentIndex = index;

    let url = song.downloadUrl[this.selectedQuality]?.url || '';

    // 🚀 Auto-convert http → https
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }

    this.audio.src = url;
    this.audio.preload = 'auto'; // Improve loading
    this.audio.load(); // Ensure audio is loaded before play
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.updateMediaSessionMetadata(song);
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

  static addToQueue(song: any) {
    if (!this.queue.some(q => q.id === song.id)) {
      this.queue.push(song);
      this.queue$.next([...this.queue]);
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

  private static setupMediaSession() {
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

  private static updateMediaSessionMetadata(song: any) {
    if ('mediaSession' in navigator) {
      const artwork = [];
      if (song.image) {
        if (Array.isArray(song.image)) {
          // Assuming image array contains objects with url/link and quality
          song.image.forEach((img: any) => {
            const src = img.link || img.url || (typeof img === 'string' ? img : '');
            if (src) {
              artwork.push({ src, sizes: '500x500', type: 'image/jpeg' });
            }
          });
        } else if (typeof song.image === 'string') {
          artwork.push({ src: song.image, sizes: '500x500', type: 'image/jpeg' });
        }
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name || song.title || 'Unknown Title',
        artist: song.primaryArtists || song.artist || 'Unknown Artist',
        album: song.album?.name || song.album || '',
        artwork: artwork.length > 0 ? artwork : undefined
      });
    }
  }

  private static updatePositionState() {
    if ('mediaSession' in navigator && this.duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: this.duration,
        playbackRate: this.audio.playbackRate,
        position: this.audio.currentTime
      });
    }
  }
}
