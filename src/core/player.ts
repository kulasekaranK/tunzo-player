import { BehaviorSubject } from 'rxjs';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { ToastController } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { Playlist, AudioTrack, RmxAudioStatusMessage } from 'capacitor-plugin-playlist';

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
  private static intendedPlaying = false;
  private static toastCtrl: ToastController;
  private static isAndroid = Capacitor.getPlatform() === 'android';

  /** Initialize with playlist and quality */
  static initialize(playlist: any[], quality = 3) {
    this.playlist = playlist;
    this.selectedQuality = quality;
    if (this.isAndroid) {
      this.setupAndroidPlayer();
    } else {
      this.setupMediaSession();
      this.setupAudioElement();
    }
    this.startWatchdog();
  }

  private static setupAndroidPlayer() {
    Playlist.addListener('status', (data) => {
      if (data && data.status && (
        data.status.msgType === RmxAudioStatusMessage.RMXSTATUS_COMPLETED ||
        data.status.msgType === RmxAudioStatusMessage.RMXSTATUS_PLAYLIST_COMPLETED
      )) {
        this.autoNext();
      }
    });
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

  private static startWatchdog() {
    setInterval(() => {
      if (this.intendedPlaying && (this.isAndroid ? false : this.audio.paused) && this.currentSong) {
        console.log('Watchdog: Audio paused unexpectedly. Attempting to resume...');
        if (this.isAndroid) {
          Playlist.play().catch(e => console.warn('Watchdog resume failed:', e));
        } else {
          this.audio.play().catch(e => console.warn('Watchdog resume failed:', e));
        }
      }
    }, 10000);
  }

  /** Call this once on user gesture to unlock audio in WebView */
  static unlockAudio() {
    if (!this.isAndroid) {
      this.audio.src = '';
      this.audio.load();
      this.audio.play().catch(() => { });
    }
  }

  static play(song: any, index: number = 0) {
    if (!song || !song.downloadUrl) return;

    this.intendedPlaying = true;

    this.currentSong = song;
    this.currentIndex = index;

    let url = song.downloadUrl[this.selectedQuality]?.url || '';

    // 🚀 Auto-convert http → https
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }

    if (this.isAndroid) {
      this.playAndroid(song, url);
    } else {
      this.audio.src = url;
      this.audio.load();

      this.audio.play().then(() => {
        this.isPlaying = true;
        this.updateMediaSessionMetadata(song);
        KeepAwake.keepAwake(); // Keep screen/CPU awake
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      }).catch((err) => {
        this.isPlaying = false;
        console.warn('Audio play failed:', err);
      });
    }
  }

  private static async playAndroid(song: any, url: string) {
    try {
      // Extract artwork
      let artworkUrl = '';
      if (song.image && Array.isArray(song.image)) {
        const highQualityImage = song.image[song.image.length - 1];
        if (highQualityImage && highQualityImage.url) {
          artworkUrl = highQualityImage.url;
        }
      }

      // Extract artist
      let artistName = 'Unknown Artist';
      if (song.artists?.primary && Array.isArray(song.artists.primary) && song.artists.primary.length > 0) {
        artistName = song.artists.primary.map((artist: any) => artist.name).join(', ');
      } else if (song.primaryArtists) {
        artistName = song.primaryArtists;
      } else if (song.artist) {
        artistName = song.artist;
      }

      const track: AudioTrack = {
        trackId: song.id,
        assetUrl: url,
        albumArt: artworkUrl,
        artist: artistName,
        album: song.album?.name || 'Unknown Album',
        title: song.name || song.title || 'Unknown Title'
      };

      await Playlist.clearAllItems();
      await Playlist.addItem({ item: track });
      await Playlist.play();
      this.isPlaying = true;
      KeepAwake.keepAwake();
    } catch (e) {
      console.error('Android play failed:', e);
      this.isPlaying = false;
    }
  }

  static pause() {
    this.intendedPlaying = false;
    this.isPlaying = false;

    if (this.isAndroid) {
      Playlist.pause();
    } else {
      this.audio.pause();
    }

    KeepAwake.allowSleep();
    if (!this.isAndroid && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  static resume() {
    this.intendedPlaying = true;
    this.isPlaying = true;

    if (this.isAndroid) {
      Playlist.play();
    } else {
      this.audio.play();
    }

    KeepAwake.keepAwake();
    if (!this.isAndroid && 'mediaSession' in navigator) {
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
    } else {
      this.intendedPlaying = false;
    }
  }

  static prev() {
    if (this.currentIndex > 0) {
      this.play(this.playlist[this.currentIndex - 1], this.currentIndex - 1);
    }
  }

  static seek(seconds: number) {
    if (this.isAndroid) {
      Playlist.seekTo({ position: seconds });
    } else {
      this.audio.currentTime = seconds;
      this.updatePositionState();
    }
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

      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name || song.title || 'Unknown Title',
        artist: artistName,
        album: song.album?.name || 'Unknown Album',
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
