import { BehaviorSubject } from 'rxjs';
export declare class Player {
    private static currentSong;
    private static currentIndex;
    private static isPlaying;
    private static currentTime;
    private static duration;
    private static isShuffle;
    private static queue;
    static queue$: BehaviorSubject<any[]>;
    private static playlist;
    private static selectedQuality;
    private static isNative;
    private static webAudio;
    /** Initialize with playlist and quality */
    static initialize(playlist: any[], quality?: number): Promise<void>;
    /** Call this once on user gesture to unlock audio in WebView (Web only) */
    static unlockAudio(): void;
    static play(song: any, index?: number): Promise<void>;
    private static playNative;
    private static playWeb;
    static pause(): void;
    static resume(): void;
    static togglePlayPause(): void;
    static next(): void;
    static prev(): void;
    static seek(seconds: number): void;
    static autoNext(): void;
    static playRandom(): void;
    static toggleShuffle(): void;
    static getShuffleStatus(): boolean;
    static addToQueue(song: any): void;
    static removeFromQueue(index: number): void;
    static reorderQueue(from: number, to: number): void;
    static getCurrentTime(): number;
    static getDuration(): number;
    static formatTime(time: number): string;
    static isPlayingSong(): boolean;
    static getCurrentSong(): any;
    static setQuality(index: number): void;
    static getQueue(): any[];
    static getPlaylist(): any[];
    private static setupNativeListeners;
    private static setupWebListeners;
    private static updateWebMediaSession;
}
