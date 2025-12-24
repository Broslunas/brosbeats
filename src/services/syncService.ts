import { supabaseAdmin } from "@/lib/supabase";
import { spotifyApi } from "@/lib/spotify";

export class SyncService {
  /**
   * Performs a comprehensive sync for a user.
   * 1. Updates User profile details
   * 2. Fetches Top Stats (Artists, Tracks)
   * 3. Creates a new StatsSnapshot
   */
  static async syncUserData(accessToken: string, spotifyId: string, email: string) {
    if (!supabaseAdmin) {
      console.error("Supabase Admin client not initialized. Skipping sync.");
      return null;
    }

    try {
      // 1. Fetch Data from Spotify
      const [profile, topArtists, topTracks, recentlyPlayed] = await Promise.all([
        spotifyApi.getProfile(accessToken),
        spotifyApi.getTopArtists(accessToken, "medium_term", 50),
        spotifyApi.getTopTracks(accessToken, "medium_term", 50),
        spotifyApi.getRecentlyPlayed(accessToken, 50),
      ]);

      // 2. Persist User & Stats
        // First get current user state to check last_played_at
        const { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("total_listened_ms, last_played_at")
            .eq("spotify_id", spotifyId)
            .single();

      // Calculate NEW listening time since last sync
      let newMs = 0;
      let lastPlayedTime = existingUser?.last_played_at ? new Date(existingUser.last_played_at).getTime() : 0;
      let newestTrackTime = lastPlayedTime;

      if (recentlyPlayed.items.length > 0) {
          // Items are usually ordered by played_at desc (newest first)
          // We want to process them, ignoring ones older than lastPlayedTime
          recentlyPlayed.items.forEach(item => {
              const pTime = new Date(item.played_at).getTime();
              if (pTime > lastPlayedTime) {
                  newMs += item.track.duration_ms;
              }
              if (pTime > newestTrackTime) {
                  newestTrackTime = pTime;
              }
          });
      }

      const currentTotalMs = (existingUser?.total_listened_ms || 0) + newMs;

      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .upsert({
          email: email,
          spotify_id: spotifyId,
          name: profile.display_name,
          avatar_url: profile.images?.[0]?.url,
          updated_at: new Date().toISOString(),
          // Update the accumulator columns
          total_listened_ms: currentTotalMs,
          last_played_at: new Date(newestTrackTime).toISOString()
        }, { onConflict: "spotify_id" })
        .select()
        .single();

      if (userError || !user) {
        throw new Error(`Failed to upsert user: ${userError?.message}`);
      }

      // 3. Create Stats Snapshot
      // Calculate simple metrics for now
      const diversityScore = this.calculateDiversityScore(topArtists.items);
      const topGenres = this.extractTopGenres(topArtists.items);
      
      // Calculate recent listening time (last 50 tracks) - Not used for total anymore, but useful for 24h stats if we wanted to snapshot it specifically
      // const recentMinutes = Math.round(recentlyPlayed.items.reduce((acc, item) => acc + item.track.duration_ms, 0) / 1000 / 60);


      const snapshotData = {
        user_id: user.id,
        snapshot_date: new Date().toISOString(),
        total_minutes_listened: Math.round(user.total_listened_ms / 1000 / 60), // Store Minutes in snapshot for easy reading
        total_tracks_played: recentlyPlayed.items.length, 
        top_artists: topArtists.items.slice(0, 10).map(a => ({ name: a.name, id: a.id, image: a.images[0]?.url })),
        top_tracks: topTracks.items.slice(0, 10).map(t => ({ name: t.name, artist: t.artists[0].name, album: t.album.images[0]?.url })),
        top_genres: topGenres,
        diversity_score: diversityScore,
      };

      const { error: snapshotError } = await supabaseAdmin
        .from("stats_snapshots")
        .insert(snapshotData);

      if (snapshotError) {
        throw new Error(`Failed to create snapshot: ${snapshotError.message}`);
      }

      return { success: true, userId: user.id };

    } catch (error) {
      console.error("Sync Error:", error);
      throw error;
    }
  }

  private static calculateDiversityScore(artists: SpotifyApi.ArtistObjectFull[]): number {
    // Simple heuristic: unique genres / total artists
    const allGenres = artists.flatMap(a => a.genres);
    const uniqueGenres = new Set(allGenres).size;
    return artists.length > 0 ? Number((uniqueGenres / artists.length).toFixed(2)) : 0;
  }

  private static extractTopGenres(artists: SpotifyApi.ArtistObjectFull[]) {
    const genreCounts: Record<string, number> = {};
    artists.flatMap(a => a.genres).forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
    
    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }
}
