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

  return snapshot;
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
        
        {/* Row 0: Now Playing (Full Width, conditionally rendered inside component) */}
        <NowPlayingWidget />

        {/* Row 1: Top Artist Hero (1 col) + Top Genres (1 col) + Top Albums (1 col) + Action (1 col) */}
        
        <div className="md:col-span-1 md:row-span-1">
            <TopArtistsWidget />
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
             <TopTracksWidget />
        </div>
        
        <div className="md:col-span-2 md:row-span-2 relative">
             <TopArtistsListWidget />
        </div>

      </div>
    </div>
  );
}
