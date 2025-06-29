export declare class TunzoPlayerAPI {
    /**
     * Search for songs using the saavn.dev API
     * @param query Search keyword (e.g., artist name, song name)
     * @param limit Number of results to return (default: 250)
     * @returns Array of song result objects
     */
    searchSongs(query: string, limit?: number): Promise<any[]>;
}
