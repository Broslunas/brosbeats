import { GlassWidget, GlassHeader, GlassContent } from "@/components/ui/GlassWidget";
import { Play, Music2, Disc, Mic2, BarChart2 } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { LoadingState } from "@/components/LoadingState";
import { RefreshButton } from "@/components/RefreshButton";
import { TopArtistsWidget } from "@/components/widgets/TopArtistsWidget";
import { TopTracksWidget } from "@/components/widgets/TopTracksWidget";
import { TopAlbumsWidget } from "@/components/widgets/TopAlbumsWidget";
import { TopGenresWidget } from "@/components/widgets/TopGenresWidget";

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

  return snapshot;
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // If not logged in, show Hero / Landing
  if (!session || !session.user?.email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
          Spotify AI Stats
        </h1>
        <p className="text-xl text-white/60 max-w-2xl">
          Unlock deep insights into your music taste. Connect your Spotify account to reveal your true audio personality.
        </p>
        <Link 
          href="/api/auth/signin" 
          className="px-8 py-4 bg-green-500 text-black font-bold rounded-full hover:scale-105 transition-transform shadow-xl shadow-green-500/20"
        >
          Connect with Spotify
        </Link>
      </div>
    );
  }

  // If logged in, load data
  const data = await getData(session.user.email);

  if (!data) {
    return <LoadingState userName={session.user.name || undefined} />;
  }

  const { diversity_score, top_genres } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-end pb-4 border-b border-white/5">
        <div>
           <h2 className="text-3xl font-bold">Your Overview</h2>
           <p className="text-white/50">Last updated: {new Date(data.created_at).toLocaleDateString()}</p>
        </div>
        <RefreshButton />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* Widget 1: Top Artist (Dynamic) */}
        <TopArtistsWidget />

        {/* Widget 2: Diversity Score (Keep static for now as it needs complex analysis) */}
        <GlassWidget className="md:col-span-2 row-span-1 p-6 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-blue-500/10">            
           <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path 
                  className="text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                  strokeDasharray={`${diversity_score * 100}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                />
              </svg>
              <div className="absolute text-xl font-bold">{Math.round(diversity_score * 100)}%</div>
           </div>
        </GlassWidget>

        {/* Widget 3: Top Genres (Dynamic) */}
        <TopGenresWidget />

        {/* Widget 4: Top Tracks (Dynamic) */}
        <TopTracksWidget />

        {/* Widget 5: Top Albums (New Dynamic) */}
        <TopAlbumsWidget />

         {/* Widget 6: Quick Action */}
         <GlassWidget className="md:col-span-1 row-span-1 flex flex-col justify-between p-6 bg-gradient-to-br from-green-500/20 to-transparent hover:from-green-500/30 cursor-pointer group transition-all">
           <div className="w-10 h-10 rounded-full bg-green-500 text-black flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
             <Play className="fill-current translate-x-0.5 w-5 h-5" />
           </div>
           <div>
             <h3 className="font-bold text-lg leading-tight">Create Playlist</h3>
             <p className="text-xs text-white/50 mt-1">Based on your recent discovery</p>
           </div>
        </GlassWidget>

      </div>
    </div>
  );
}
