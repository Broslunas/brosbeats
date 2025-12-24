import { supabase } from "@/lib/supabase";

export async function getSpotifyIdByEmail(email: string) {
  const { data, error } = await supabase
    .from("users")
    .select("spotify_id")
    .eq("email", email)
    .single();

  if (error || !data) return null;
  return data.spotify_id;
}
