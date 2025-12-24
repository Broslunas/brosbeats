import { supabaseAdmin } from "@/lib/supabase";
import { GlassWidget, GlassHeader, GlassContent } from "@/components/ui/GlassWidget";
import { GenreChart } from "@/components/GenreChart";
import { ListeningTimeWidget } from "@/components/ListeningTimeWidget";
import Image from "next/image";
import { Music2, Lock } from "lucide-react";
import { notFound } from "next/navigation";

// Revalidate public profiles every 5 minutes
export const revalidate = 300;

async function getPublicProfile(spotifyId: string) {
  if (!supabaseAdmin) return null;

  // 1. Get User by Spotify ID
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, avatar_url, spotify_id")
    .eq("spotify_id", spotifyId)
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

export default async function UserProfile({ params }: { params: { name: string } }) {
  // params.name corresponds to the dynamic route segment [name]
  // In our case we are using spotify_id as the identifier for now
  const profile = await getPublicProfile(params.name);

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
        
        {/* Top Artist */}
        {stats?.top_artists?.[0] && (
          <GlassWidget className="md:col-span-2 md:row-span-2 relative overflow-hidden group">
             <div className="absolute inset-0">
               <Image 
                 src={stats.top_artists[0].image || '/placeholder.png'} 
                 alt={stats.top_artists[0].name}
                 fill
                 className="object-cover opacity-60"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-end p-6">
               <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded w-fit mb-2">#1 ARTIST</span>
               <h3 className="text-4xl font-bold">{stats.top_artists[0].name}</h3>
            </div>
          </GlassWidget>
        )}

        {/* Listening Time */}
        <ListeningTimeWidget 
            totalMinutes={stats?.total_minutes_listened || 0} 
            totalTracks={stats?.total_tracks_played || 0} 
        />

        {/* Genre Chart */}
        <GenreChart genres={mappedGenres} />

         {/* Top Tracks List */}
         <GlassWidget className="md:col-span-2 md:row-span-2 overflow-hidden flex flex-col">
            <GlassHeader>
               <span className="font-semibold flex items-center gap-2">
                 <Music2 className="w-4 h-4" /> Top Tracks
               </span>
            </GlassHeader>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 max-h-[300px]">
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

      </div>
    </div>
  );
}
