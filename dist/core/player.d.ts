export declare class Player {
    private static audio;
    private static currentSong;
    private static currentIndex;
    private static isPlaying;
    private static currentTime;
    private static duration;
    private static isShuffle;
    private static queue;
    private static playlist;
    private static selectedQuality;
    /** Initialize with playlist and quality */
    static initialize(playlist: any[], quality?: number): void;
    static play(song: any, index?: number): void;
    static pause(): void;
    static resume(): void;
    static togglePlayPause(): void;
    static next(): void;
    static prev(): void;
    static seek(seconds: number): void;
    static autoNext(): void;
    static playRandom(): void;
    static toggleShuffle(): void;
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
}
