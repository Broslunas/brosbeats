import { supabaseAdmin } from "@/lib/supabase";
import { GlassWidget, GlassHeader, GlassContent } from "@/components/ui/GlassWidget";


import Image from "next/image";
import { Music2, Lock } from "lucide-react";
import { notFound } from "next/navigation";

// Revalidate public profiles every 5 minutes
export const revalidate = 300;

async function getPublicProfile(name: string) {
  if (!supabaseAdmin) return null;

  // 1. Get User by Name
  // We decode the URL component to ensure we match the name in DB correctly (e.g. spaces)
  const decodedName = decodeURIComponent(name);
  
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, avatar_url, spotify_id")
    .ilike("name", decodedName)
    .single();

  if (!user) return null;

  // 2. Check Privacy
  const { data: privacy } = await supabaseAdmin
    .from("privacy_settings")
    .select("status")
    .eq("user_id", user.id)
    .single();
    
  // If private, return restricted view
  if (privacy?.status === 'private') {
      return { user, isPrivate: true };
  }

  // 3. Get Stats
  const { data: snapshot } = await supabaseAdmin
    .from("stats_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return { user, stats: snapshot, isPrivate: false };
}

export default async function UserProfile({ params }: { params: Promise<{ name: string }> }) {
  // params.name corresponds to the dynamic route segment [name]
  const { name } = await params;
  // In our case we are using spotify_id as the identifier for now
  const profile = await getPublicProfile(name);

  if (!profile) {
    notFound();
  }

  const { user, stats, isPrivate } = profile;

  if (isPrivate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
         <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 opacity-50">
            <Image src={user.avatar_url || "/placeholder.png"} alt={user.name} fill className="object-cover grayscale" />
         </div>
         <h1 className="text-3xl font-bold text-white/50">{user.name}</h1>
         
         <GlassWidget className="p-8 flex flex-col items-center gap-4">
            <div className="p-4 bg-white/5 rounded-full">
                <Lock className="w-8 h-8 text-white/40" />
            </div>
            <p className="text-lg font-medium">This profile is private.</p>
         </GlassWidget>
      </div>
    );
  }

  // Sanitize stats for render
  const mappedGenres = (stats?.top_genres as any[])?.map((g: any) => ({ name: g.name, count: g.count })) || [];
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Profile Header */}
      <header className="flex flex-col md:flex-row items-center md:items-end gap-6 pb-8 border-b border-white/5">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-green-500 shadow-xl shadow-green-500/20">
            <Image src={user.avatar_url || "/placeholder.png"} alt={user.name} fill className="object-cover" />
        </div>
        <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                {user.name}
            </h1>
            <p className="text-white/60 flex items-center justify-center md:justify-start gap-2">
                <Music2 className="w-4 h-4" /> Spotify AI Stats
            </p>
        </div>
      </header>

      {/* Stats Grid - Reusing components but read-only */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
        
         {/* Row 1: Top Artist 1x1, Genres 1x1, Albums 1x1 (mocked if missing in snapshot), ListeningTime 1x1 */}
        
        {/* Widget 1: Top Artist (Minified 1x1) */}
        {stats?.top_artists?.[0] ? (
          <GlassWidget className="md:col-span-1 md:row-span-1 relative overflow-hidden group min-h-[160px]">
             <div className="absolute inset-0">
               <Image 
                 src={stats.top_artists[0].image || '/placeholder.png'} 
                 alt={stats.top_artists[0].name}
                 fill
                 className="object-cover opacity-60"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-end p-4">
               <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded w-fit mb-2">#1 ARTIST</span>
               <h3 className="text-2xl font-bold truncate">{stats.top_artists[0].name}</h3>
            </div>
          </GlassWidget>
        ) : <div className="md:col-span-1 bg-white/5 rounded-2xl" />}

         {/* Widget 2: Top Genres 1x1 */}
         <GlassWidget className="md:col-span-1 md:row-span-1 p-5 overflow-hidden flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-2 text-white/70 border-b border-white/5 pb-2">
                 <span className="text-sm font-semibold">Top Genres</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[200px]">
                <ul className="space-y-3 pt-2">
                    {mappedGenres.slice(0, 5).map((genre: any, i: number) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                        <span className="capitalize text-white/80">{genre.name}</span>
                        <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-white/50" style={{ width: `${Math.min(100, (genre.count / (mappedGenres[0]?.count || 1)) * 100)}%` }} />
                        </div>
                    </li>
                    ))}
                </ul>
            </div>
         </GlassWidget>

        {/* Widget 4: Listening Time (Static from snapshot) */}
        <div className="md:col-span-1 md:row-span-1">
             <GlassWidget className="p-5 flex flex-col justify-center h-full bg-gradient-to-br from-blue-500/10 to-transparent">
                 <h3 className="text-3xl font-bold text-white mb-1">
                     {Math.round((stats?.total_minutes_listened || 0) / 60)} <span className="text-sm font-normal text-white/50">hrs</span>
                 </h3>
                 <p className="text-xs text-blue-200/60">Recent tracked time</p>
             </GlassWidget>
        </div>
        
        {/* Placeholder for Albums or empty slot to maintain grid balance  */}
        <div className="md:col-span-1 md:row-span-1 bg-white/5 rounded-2xl animate-pulse" />


         {/* Row 2: Top Tracks List 2x2 */}
         <GlassWidget className="md:col-span-2 md:row-span-2 overflow-hidden flex flex-col">
            <GlassHeader className="flex justify-between items-center bg-white/5">
               <span className="font-semibold flex items-center gap-2">
                 <Music2 className="w-4 h-4" /> Top Tracks
               </span>
            </GlassHeader>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 max-h-[400px] custom-scrollbar">
              {stats?.top_tracks?.map((track: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="text-xs text-white/30 w-4 font-mono">{i + 1}</div>
                   <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-white/10">
                     {track.album && (
                       <Image src={track.album} alt={track.name} fill className="object-cover" />
                     )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate text-white/90">{track.name}</div>
                    <div className="text-xs text-white/50 truncate">{track.artist}</div>
                  </div>
                </div>
              ))}
            </div>
        </GlassWidget>
        
        {/* Row 2: Top Artists List 2x2 */}
         <GlassWidget className="md:col-span-2 md:row-span-2 overflow-hidden flex flex-col">
            <GlassHeader className="flex justify-between items-center bg-white/5">
               <span className="font-semibold flex items-center gap-2">
                 <Music2 className="w-4 h-4" /> Top Artists
               </span>
            </GlassHeader>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 max-h-[400px] custom-scrollbar">
              {stats?.top_artists?.map((artist: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="text-xs text-white/30 w-4 font-mono">{i + 1}</div>
                   <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                     {artist.image && (
                       <Image src={artist.image} alt={artist.name} fill className="object-cover" />
                     )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate text-white/90">{artist.name}</div>
                  </div>
                </div>
              ))}
            </div>
        </GlassWidget>
      </div>
    </div>
  );
}
