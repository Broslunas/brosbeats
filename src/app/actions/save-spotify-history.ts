
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";

export async function saveSpotifyHistory(tracks: any[]) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return { error: "Unauthorized" };
  }

  if (!supabaseAdmin) {
    return { error: "Server configuration error" };
  }

  try {
     // Get user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !user) {
      return { error: "User not found" };
    }

    // Process and normalize data (Server Side Double Check)
    // We expect the client to send mostly clean data, but we re-map to be safe and authoritative.
    const normalizedData = tracks.map((item) => {
        // We assume Client sends { played_at, track_name, artist_name, ms_played, ... }
        // that matches our DB schema requirements or close to it.
        // Or we assume Client sends RAW item and we normalize here?
        // Let's assume Client sends RAW item to keep logic centralized if we want, OR client normalizes.
        // BETTER: Client sends RAW items (lighter payload than normalized?) No, Normalized is cleaner.
        // Let's assume Client sends ALREADY NORMALIZED objects to save bandwidth?
        // Actually, let's trust the input schema from client is:
        // { played_at, track_name, artist_name, album_name, ms_played, spotify_track_uri, platform }
        
        // Fast validation
        if (!item.played_at || !item.track_name) return null;

        return {
            user_id: user.id,
            played_at: item.played_at,
            artist_name: item.artist_name,
            track_name: item.track_name,
            album_name: item.album_name,
            ms_played: item.ms_played,
            spotify_track_uri: item.spotify_track_uri,
            platform: item.platform || "client_import"
        };
    }).filter(Boolean);

    if (normalizedData.length === 0) {
        return { success: true, count: 0 }; 
    }

    const { error } = await supabaseAdmin
        .from("streaming_history")
        .insert(normalizedData);
    
    if (error) {
        console.error("Batch insert error:", error);
        return { error: error.message };
    }

    return { 
        success: true, 
        count: normalizedData.length 
    };

  } catch (error: any) {
    console.error("Save Action error:", error);
    return { error: error.message };
  }
}
