export class Player {
    private static audio = new Audio();
    private static currentSong: any = null;
    private static currentIndex = 0;
    private static isPlaying = false;
    private static currentTime = 0;
    private static duration = 0;
    private static isShuffle = true;
    private static queue: any[] = [];
    private static playlist: any[] = [];
    private static selectedQuality = 3;
  
    /** Initialize with playlist and quality */
    static initialize(playlist: any[], quality = 3) {
      this.playlist = playlist;
      this.selectedQuality = quality;
    }
  
    /** Call this once on user gesture to unlock audio in WebView */
    static unlockAudio() {
      this.audio.src = '';
      this.audio.load();
      this.audio.play().catch(() => {});
    }
  
    static play(song: any, index: number = 0) {
      if (!song || !song.downloadUrl) return;
  
      this.currentSong = song;
      this.currentIndex = index;
      this.audio.src = song.downloadUrl[this.selectedQuality]?.url || '';
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
      } else {
        this.resume();
      }
    }
  
    static next() {
      if (this.queue.length > 0) {
        const nextQueued = this.queue.shift();
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
  
    static addToQueue(song: any) {
      if (!this.queue.some(q => q.id === song.id)) {
        this.queue.push(song);
      }
    }
  
    static removeFromQueue(index: number) {
      this.queue.splice(index, 1);
    }
  
    static reorderQueue(from: number, to: number) {
      const item = this.queue.splice(from, 1)[0];
      this.queue.splice(to, 0, item);
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
  }
