"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TunzoPlayerAPI = void 0;
class TunzoPlayerAPI {
    /**
     * Search for songs using the saavn.dev API
     * @param query Search keyword (e.g., artist name, song name)
     * @param limit Number of results to return (default: 250)
     * @returns Array of song result objects
     */
    searchSongs(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 250) {
            var _a;
            try {
                const response = yield fetch(`https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = yield response.json();
                return ((_a = json === null || json === void 0 ? void 0 : json.data) === null || _a === void 0 ? void 0 : _a.results) || [];
            }
            catch (error) {
                console.error("TunzoPlayerAPI Error:", error);
                return [];
            }
        });
    }
    /**
     * Search for playlists
     * @param query Search keyword
     * @param limit Number of results (default: 1000)
     */
    searchPlaylists(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 1000) {
            var _a;
            try {
                const response = yield fetch(`https://saavn.sumit.co/api/search/playlists?query=${encodeURIComponent(query)}&limit=${limit}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = yield response.json();
                return ((_a = json === null || json === void 0 ? void 0 : json.data) === null || _a === void 0 ? void 0 : _a.results) || [];
            }
            catch (error) {
                console.error("TunzoPlayerAPI Error (searchPlaylists):", error);
                return [];
            }
        });
    }
    /**
     * Get playlist details
     * @param id Playlist ID
     * @param link Playlist URL/Link (optional but recommended if available)
     * @param limit Number of songs to return (default: 1000)
     */
    getPlaylistDetails(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, link = "", limit = 1000) {
            try {
                let url = `https://saavn.sumit.co/api/playlists?id=${id}&limit=${limit}`;
                if (link) {
                    url += `&link=${encodeURIComponent(link)}`;
                }
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = yield response.json();
                return (json === null || json === void 0 ? void 0 : json.data) || null;
            }
            catch (error) {
                console.error("TunzoPlayerAPI Error (getPlaylistDetails):", error);
                return null;
            }
        });
    }
    /**
     * Search for albums
     * @param query Search keyword
     * @param limit Number of results (default: 1000)
     */
    searchAlbums(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 1000) {
            var _a;
            try {
                const response = yield fetch(`https://saavn.sumit.co/api/search/albums?query=${encodeURIComponent(query)}&limit=${limit}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = yield response.json();
                return ((_a = json === null || json === void 0 ? void 0 : json.data) === null || _a === void 0 ? void 0 : _a.results) || [];
            }
            catch (error) {
                console.error("TunzoPlayerAPI Error (searchAlbums):", error);
                return [];
            }
        });
    }
    /**
     * Get album details
     * @param id Album ID
     * @param link Album URL/Link (optional but recommended if available)
     */
    getAlbumDetails(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, link = "") {
            try {
                let url = `https://saavn.sumit.co/api/albums?id=${id}`;
                if (link) {
                    url += `&link=${encodeURIComponent(link)}`;
                }
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = yield response.json();
                return (json === null || json === void 0 ? void 0 : json.data) || null;
            }
            catch (error) {
                console.error("TunzoPlayerAPI Error (getAlbumDetails):", error);
                return null;
            }
        });
    }
}
exports.TunzoPlayerAPI = TunzoPlayerAPI;
