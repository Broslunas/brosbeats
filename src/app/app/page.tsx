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
  // We get the most recent one
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

  if (rpcError) {
      console.warn("RPC calculate_user_stats failed:", rpcError.message);
  }

  // Merge Data
  let refinedStats = snapshot || {};

  if (historyStats) {
      // 1. Total Minutes
      if (historyStats.total_minutes > 0) {
          refinedStats.total_minutes_listened = historyStats.total_minutes;
      }
      
      // 2. Top Artists (Merge images from snapshot if available)
      if (historyStats.top_artists && historyStats.top_artists.length > 0) {
          const imageMap = new Map();
          (snapshot?.top_artists || []).forEach((a: any) => {
              if (a.name && a.image) imageMap.set(a.name.toLowerCase(), a.image);
          });

          refinedStats.top_artists = historyStats.top_artists.map((a: any) => ({
              ...a,
              image: imageMap.get(a.name.toLowerCase()) || null 
          }));
      }

      // 3. Top Tracks (Merge album art)
      if (historyStats.top_tracks && historyStats.top_tracks.length > 0) {
          const artMap = new Map();
          (snapshot?.top_tracks || []).forEach((t: any) => {
               if (t.name && t.album) artMap.set(t.name.toLowerCase(), t.album);
          });

          refinedStats.top_tracks = historyStats.top_tracks.map((t: any) => ({
              ...t,
              album: artMap.get(t.name.toLowerCase()) || null
          }));
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
