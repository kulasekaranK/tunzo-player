export declare class TunzoPlayerAPI {
    private baseUrl;
    /**
     * Register/Update the base API URL
     * @param url The new base URL to use for API calls
     */
    registerApiUrl(url: string): void;
    /**
     * Search for songs using the API
     * @param query Search keyword (e.g., artist name, song name)
     * @param limit Number of results to return (default: 250)
     * @returns Array of song result objects
     */
    searchSongs(query: string, limit?: number): Promise<any[]>;
    suggesstedSongs(id: string, limit?: number): Promise<any[]>;
    /**
     * Search for playlists
     * @param query Search keyword
     * @param limit Number of results (default: 1000)
     */
    searchPlaylists(query: string, limit?: number): Promise<any[]>;
    /**
     * Get playlist details
     * @param id Playlist ID
     * @param link Playlist URL/Link (optional but recommended if available)
     * @param limit Number of songs to return (default: 1000)
     */
    getPlaylistDetails(id: string, link?: string, limit?: number): Promise<any>;
    /**
     * Search for albums
     * @param query Search keyword
     * @param limit Number of results (default: 1000)
     */
    searchAlbums(query: string, limit?: number): Promise<any[]>;
    searchArtist(query: string, limit?: number): Promise<any[]>;
    /**
     * Get album details
     * @param id Album ID
     * @param link Album URL/Link (optional but recommended if available)
     */
    getAlbumDetails(id: string, link?: string): Promise<any>;
    getartistDetails(id: string): Promise<any>;
}
