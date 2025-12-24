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
      const [profile, topArtists, topTracks] = await Promise.all([
        spotifyApi.getProfile(accessToken),
        spotifyApi.getTopArtists(accessToken, "medium_term", 50),
        spotifyApi.getTopTracks(accessToken, "medium_term", 50),
      ]);

      // 2. Upsert User into Supabase
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .upsert({
          email: email,
          spotify_id: spotifyId,
          name: profile.display_name,
          avatar_url: profile.images?.[0]?.url,
          updated_at: new Date().toISOString(),
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

      const snapshotData = {
        user_id: user.id,
        snapshot_date: new Date().toISOString(),
        total_tracks_played: 0, // Cannot get this easily from API anymore without full history crawl
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
