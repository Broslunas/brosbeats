import { GlassWidget, GlassHeader, GlassContent } from "@/components/ui/GlassWidget";
import { Play, Music2, Disc, Mic2, BarChart2 } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

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
    return (
      <div className="text-center py-20 animate-in fade-in">
        <h2 className="text-2xl font-bold mb-4">Welcome, {session.user.name}</h2>
        <p className="text-white/60 mb-8">We are crunching your numbers for the first time...</p>
        <GlassWidget className="p-8 max-w-md mx-auto flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
           <p className="text-sm text-green-400 animate-pulse">Analyzing Library...</p>
        </GlassWidget>
        {/* Force a sync if it's taking too long via client side would be better, but user just logged in so auto-sync should happen */}
      </div>
    );
  }

  const { top_artists, top_tracks, diversity_score, top_genres } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-end pb-4 border-b border-white/5">
        <div>
           <h2 className="text-3xl font-bold">Your Overview</h2>
           <p className="text-white/50">Last updated: {new Date(data.created_at).toLocaleDateString()}</p>
        </div>
        <Link href="/api/sync" className="text-xs text-green-400 hover:text-green-300 transition-colors">
          Refresh Data
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* Widget 1: Top Artist (Hero) */}
        {top_artists?.[0] && (
          <GlassWidget className="md:col-span-2 md:row-span-2 relative overflow-hidden group">
            <div className="absolute inset-0">
               <Image 
                 src={top_artists[0].image || '/placeholder.png'} 
                 alt={top_artists[0].name}
                 fill
                 className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>
            
            <div className="relative z-10 h-full flex flex-col justify-end p-6">
               <span className="bg-green-500/90 text-black text-xs font-bold px-2 py-1 rounded w-fit mb-2">#1 ARTIST</span>
               <h3 className="text-4xl font-bold">{top_artists[0].name}</h3>
               <p className="text-white/80 mt-1 capitalize">{top_genres?.[0]?.name || 'Unknown Genre'}</p>
            </div>
          </GlassWidget>
        )}

        {/* Widget 2: Diversity Score */}
        <GlassWidget className="md:col-span-2 row-span-1 p-6 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-blue-500/10">
           <div>
             <div className="flex items-center gap-2 mb-2">
               <BarChart2 className="w-5 h-5 text-purple-400" />
               <h3 className="font-semibold text-white/80">Sonic Diversity</h3>
             </div>
             <p className="text-sm text-white/50 max-w-[200px]">
               {diversity_score > 0.7 ? "You're an explorer! wide taste." : "You know what you like and stick to it."}
             </p>
           </div>
           
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

        {/* Widget 3: Top Genres List */}
        <GlassWidget className="md:col-span-1 row-span-1 p-5 overflow-hidden">
           <div className="flex items-center gap-2 mb-4 text-white/70">
             <Disc className="w-4 h-4" />
             <span className="text-sm font-semibold">Top Genres</span>
           </div>
           <ul className="space-y-3">
             {top_genres?.slice(0, 3).map((genre: any, i: number) => (
               <li key={i} className="flex items-center justify-between text-sm">
                 <span className="capitalize">{genre.name}</span>
                 <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-white/50" style={{ width: `${Math.random() * 50 + 50}%` }} />
                 </div>
               </li>
             ))}
           </ul>
        </GlassWidget>

        {/* Widget 4: Top Tracks List */}
        <GlassWidget className="md:col-span-1 md:row-span-2 overflow-hidden flex flex-col">
            <GlassHeader className="flex justify-between items-center bg-white/5">
               <span className="font-semibold flex items-center gap-2">
                 <Music2 className="w-4 h-4" /> Top Tracks
               </span>
            </GlassHeader>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {top_tracks?.map((track: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                  <div className="text-xs text-white/30 w-4 font-mono">{i + 1}</div>
                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-white/10">
                     {track.album && (
                       <Image src={track.album} alt={track.name} fill className="object-cover" />
                     )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate text-white/90 group-hover:text-green-400 transition-colors">{track.name}</div>
                    <div className="text-xs text-white/50 truncate">{track.artist}</div>
                  </div>
                </div>
              ))}
            </div>
        </GlassWidget>

         {/* Widget 5: Quick Action */}
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
