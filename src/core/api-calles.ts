export class TunzoPlayerAPI {
    /**
     * Search for songs using the saavn.dev API
     * @param query Search keyword (e.g., artist name, song name)
     * @param limit Number of results to return (default: 250)
     * @returns Array of song result objects
     */
    async searchSongs(query: string, limit: number = 250): Promise<any[]> {
      try {
        const response = await fetch(
          `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`
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
  }
  