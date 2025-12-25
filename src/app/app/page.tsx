import { GlassWidget, GlassHeader, GlassContent } from "@/components/ui/GlassWidget";
import { Play, Music2, Disc, Mic2, BarChart2 } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { LoadingState } from "@/components/LoadingState";
import { RefreshButton } from "@/components/RefreshButton";
import { TopArtistsWidget } from "@/components/widgets/TopArtistsWidget";
import { TopTracksWidget } from "@/components/widgets/TopTracksWidget";
import { TopAlbumsWidget } from "@/components/widgets/TopAlbumsWidget";
import { TopGenresWidget } from "@/components/widgets/TopGenresWidget";
import { TopArtistsListWidget } from "@/components/widgets/TopArtistsListWidget";
import { ListeningTimeWidget } from "@/components/widgets/ListeningTimeWidget";
import { NowPlayingWidget } from "@/components/widgets/NowPlayingWidget";
import { redirect } from "next/navigation";

// Revalidate data every minute so it feels fresh but efficient
export const revalidate = 60;

import { spotifyApi } from "@/lib/spotify";

async function getData(email: string) {
  if (!supabaseAdmin) return null;

  // 1. Get User
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name")
    .eq("email", email)
    .single();

  if (!user) return null;

  // 2. Get User Snapshot
  const { data: snapshot } = await supabaseAdmin
    .from("stats_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // 3. Get Real-time Stats from History (RPC)
  const { data: historyStats, error: rpcError } = await supabaseAdmin
    .rpc('calculate_user_stats', { target_user_id: user.id });

  if (rpcError) console.warn("RPC calculate_user_stats failed:", rpcError.message);

  // 4. Merge Data & Backfill Images
  let refinedStats = snapshot || {};

  if (historyStats) {
      if (historyStats.total_minutes > 0) {
          refinedStats.total_minutes_listened = historyStats.total_minutes;
      }
      
      // Get Access Token for Image Backfilling
      // We need a fresh token. If session exists, we might need to refresh it.
      // For server-side fetching here, we can try to use the session's token if active,
      // OR better, since we are inside a server component component (Page), call getsession.
      // But we are in `getData` helper. Let's pass session token to it?
      // Or just skip if no token. Wait, we need the token.
      
      const session = await getServerSession(authOptions);
      const accessToken = (session as any)?.accessToken;

      // Artists
      if (historyStats.top_artists && historyStats.top_artists.length > 0) {
          const imageMap = new Map();
          (snapshot?.top_artists || []).forEach((a: any) => {
              // Handle both flattened 'image' and standard Spotify 'images' array
              const imgUrl = a.image || a.images?.[0]?.url;
              if (a.name && imgUrl) {
                  imageMap.set(a.name.toLowerCase().trim(), imgUrl);
              }
          });

          // Identify missing images
          const artistsWithImages = await Promise.all(historyStats.top_artists.map(async (a: any) => {
              const cleanName = a.name?.toLowerCase().trim();
              if (!cleanName) return a; // Skip if no name

              let imageUrl = imageMap.get(cleanName) || null;

              // If missing and we have a token, try to fetch ONCE
              if (!imageUrl && accessToken && a.name !== "Unknown Artist") {
                  try {
                      const searchRes = await spotifyApi.search(accessToken, a.name, 'artist', 1);
                      if (searchRes.artists?.items?.length > 0) {
                          const foundArtist = searchRes.artists.items[0];
                          // Verify name match to avoid wrong artist (e.g. "Duki" finding "Duki & ...")
                          // Allow partial match if it starts with the name? 
                          // Let's be semi-strict.
                          if (foundArtist.name.toLowerCase().includes(cleanName) || cleanName.includes(foundArtist.name.toLowerCase())) {
                               imageUrl = foundArtist.images?.[0]?.url || null;
                          }
                      }
                  } catch (e) {
                      // ignore error
                  }
              }

              return { ...a, image: imageUrl };
          }));

          refinedStats.top_artists = artistsWithImages;
      }

      // Tracks
      if (historyStats.top_tracks && historyStats.top_tracks.length > 0) {
          const artMap = new Map();
          const artistImgMap = new Map(); // Also collect artist images from tracks!
          const trackUris: string[] = [];

          // 1. Pre-fill from snapshot and collect URIs
          (snapshot?.top_tracks || []).forEach((t: any) => {
               if (t.name && t.artist && t.album) {
                   artMap.set(`${t.name}:${t.artist}`.toLowerCase(), t.album);
               }
          });

          // Collect valid IDs from imported history
          historyStats.top_tracks.forEach((t: any) => {
               // uri format is usually "spotify:track:ID"
               if (t.uri && t.uri.startsWith("spotify:track:")) {
                   trackUris.push(t.uri.split(":")[2]);
               }
          });

          // 2. Batch Fetch Tracks from Spotify (Max 50 per request, we have 20 limit so ok)
          if (accessToken && trackUris.length > 0) {
              try {
                  const tracksRes = await spotifyApi.getTracks(accessToken, trackUris);
                  tracksRes.tracks.forEach(track => {
                      if (track) {
                          // Map Track Images
                           const key = `${track.name}:${track.artists[0]?.name}`.toLowerCase();
                           if (track.album?.images?.[0]?.url) {
                               artMap.set(key, track.album.images[0].url);
                               // Also map by direct name if exact match
                               artMap.set(track.name.toLowerCase(), track.album.images[0].url);
                           }

                           // Map Artist Images (Bonus!)
                           // Track object contains simplified artist, which usually DOES NOT have images. 
                           // Wait, track.artists is SimplifiedArtistObject. No images there.
                           // So we still have to fetch artists separately or search for them.
                           // BUT, we can use the track->album->art as a fallback for the artist if needed? No that's bad.
                           // Okay, we stick to track images here.
                      }
                  });
              } catch (e) {
                   console.error("Batch track fetch failed:", e);
              }
          }

          // 3. Assign Images
          const tracksWithImages = await Promise.all(historyStats.top_tracks.map(async (t: any) => {
               // Try composite key first
               let albumUrl = artMap.get(`${t.name}:${t.artist}`.toLowerCase());
               // Try simple name second (fallback)
               if (!albumUrl) albumUrl = artMap.get(t.name.toLowerCase());

               // Search fallback (only if no URI and no map match)
               if (!albumUrl && accessToken && !t.uri) {
                  try {
                       const query = `track:${t.name} artist:${t.artist}`;
                       const searchRes = await spotifyApi.search(accessToken, query, 'track', 1);
                       if (searchRes.tracks?.items?.length > 0) {
                           albumUrl = searchRes.tracks.items[0].album?.images?.[0]?.url || null;
                       }
                  } catch (e) {}
               }

               return { ...t, album: albumUrl };
          }));

          refinedStats.top_tracks = tracksWithImages;
      }
  }

  return refinedStats;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  // If not logged in, redirect to login
  if (!session || !session.user?.email) {
    redirect("/api/auth/signin");
  }

  // If logged in, load data
  const data = await getData(session.user.email);

  if (!data) {
    return <LoadingState userName={session.user.name || undefined} />;
  }

  const { diversity_score, top_genres, top_artists, top_tracks } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-end pb-4 border-b border-white/5">
        <div>
           <h2 className="text-3xl font-bold">Your Overview</h2>
           <p className="text-white/50">
               {data.total_minutes_listened > 0 ? "Includes imported history" : "Snapshot data"}
           </p>
        </div>
        <RefreshButton />
      </header>


      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* Row 0: Now Playing (Full Width, conditionally rendered inside component) */}
        <NowPlayingWidget />

        {/* Row 1: Top Artist Hero (1 col) + Top Genres (1 col) + Top Albums (1 col) + Action (1 col) */}
        
        <div className="md:col-span-1 md:row-span-1">
            <TopArtistsWidget initialData={top_artists} />
        </div>
        
        <div className="md:col-span-1 md:row-span-1">
             <TopGenresWidget />
        </div>

        <div className="md:col-span-1 md:row-span-1">
             <TopAlbumsWidget />
        </div>

        <div className="md:col-span-1 md:row-span-1">
             <ListeningTimeWidget lifetimeMinutes={data.total_minutes_listened} />
        </div>

        {/* Row 2: Top Tracks List (2 col) + Top Artists List (2 col) */}
        
        <div className="md:col-span-2 md:row-span-2 relative">
             <TopTracksWidget initialData={top_tracks} />
        </div>
        
        <div className="md:col-span-2 md:row-span-2 relative">
             <TopArtistsListWidget initialData={top_artists} />
        </div>

      </div>
    </div>
  );
}
