const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

interface SpotifyFetchOptions {
  accessToken: string;
  endpoint: string;
}

async function fetchSpotify<T>({ accessToken, endpoint }: SpotifyFetchOptions): Promise<T> {
  const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
        // Handle 401/403 specifically if needed, but for now throw
    const error = await res.json().catch(() => ({}));
    throw new Error(`Spotify API Error: ${res.status} ${JSON.stringify(error)}`);
  }

  return res.json();
}

export const spotifyApi = {
  getProfile: async (accessToken: string) => {
    return fetchSpotify<SpotifyApi.CurrentUsersProfileResponse>({
      accessToken,
      endpoint: "/me",
    });
  },
  
  getTopArtists: async (accessToken: string, time_range: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20) => {
    return fetchSpotify<SpotifyApi.UsersTopArtistsResponse>({
      accessToken,
      endpoint: `/me/top/artists?time_range=${time_range}&limit=${limit}`,
    });
  },

  getTopTracks: async (accessToken: string, time_range: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 20) => {
    return fetchSpotify<SpotifyApi.UsersTopTracksResponse>({
      accessToken,
      endpoint: `/me/top/tracks?time_range=${time_range}&limit=${limit}`,
    });
  },

  getRecentlyPlayed: async (accessToken: string, limit = 50) => {
     return fetchSpotify<SpotifyApi.UsersRecentlyPlayedTracksResponse>({
        accessToken,
        endpoint: `/me/player/recently-played?limit=${limit}`,
     })
  }
};
