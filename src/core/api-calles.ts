export class TunzoPlayerAPI {
  private baseUrl: string = "https://saavn.sumit.co/api";

  /**
   * Register/Update the base API URL
   * @param url The new base URL to use for API calls
   */
  registerApiUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Search for songs using the API
   * @param query Search keyword (e.g., artist name, song name)
   * @param limit Number of results to return (default: 250)
   * @returns Array of song result objects
   */
  async searchSongs(query: string, limit: number = 250): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json?.data?.results || [];
    } catch (error) {
      console.error("TunzoPlayerAPI Error:", error);
      return [];
    }
  }

  async suggesstedSongs(id: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(
        `https://tunzo-api.vercel.app/api/songs/${id}/suggestions?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json?.data?.results || [];
    } catch (error) {
      console.error("TunzoPlayerAPI Error (suggesstedSongs):", error);
      return [];
    }
  }

  /**
   * Search for playlists
   * @param query Search keyword
   * @param limit Number of results (default: 1000)
   */
  async searchPlaylists(query: string, limit: number = 1000): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/playlists?query=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json?.data?.results || [];
    } catch (error) {
      console.error("TunzoPlayerAPI Error (searchPlaylists):", error);
      return [];
    }
  }

  /**
   * Get playlist details
   * @param id Playlist ID
   * @param link Playlist URL/Link (optional but recommended if available)
   * @param limit Number of songs to return (default: 1000)
   */
  async getPlaylistDetails(id: string, link: string = "", limit: number = 1000): Promise<any> {
    try {
      let url = `${this.baseUrl}/playlists?id=${id}&limit=${limit}`;
      if (link) {
        url += `&link=${encodeURIComponent(link)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json?.data || null;
    } catch (error) {
      console.error("TunzoPlayerAPI Error (getPlaylistDetails):", error);
      return null;
    }
  }

  /**
   * Search for albums
   * @param query Search keyword
   * @param limit Number of results (default: 1000)
   */
  async searchAlbums(query: string, limit: number = 1000): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/albums?query=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json?.data?.results || [];
    } catch (error) {
      console.error("TunzoPlayerAPI Error (searchAlbums):", error);
      return [];
    }
  }

  /**
   * Get album details
   * @param id Album ID
   * @param link Album URL/Link (optional but recommended if available)
   */
  async getAlbumDetails(id: string, link: string = ""): Promise<any> {
    try {
      let url = `${this.baseUrl}/albums?id=${id}`;
      if (link) {
        url += `&link=${encodeURIComponent(link)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      return json?.data || null;
    } catch (error) {
      console.error("TunzoPlayerAPI Error (getAlbumDetails):", error);
      return null;
    }
  }
}
