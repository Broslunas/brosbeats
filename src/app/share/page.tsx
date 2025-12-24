import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { ShareableStatsCard } from "@/components/ShareableStatsCard";
import { redirect } from "next/navigation";
import { GlassWidget } from "@/components/ui/GlassWidget";

async function getUserStats(email: string) {
  if (!supabaseAdmin) return null;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name")
    .eq("email", email)
    .single();

  if (!user) return null;

  const { data: snapshot } = await supabaseAdmin
    .from("stats_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return snapshot ? { ...snapshot, userName: user.name } : null;
}

export default async function SharePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/login");
  }

  const stats = await getUserStats(session.user.email);

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassWidget className="p-12 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">No Stats Yet</h2>
          <p className="text-white/60 mb-6">
            You need to have your stats synced before creating a shareable card.
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition-colors"
          >
            Go to Dashboard
          </a>
        </GlassWidget>
      </div>
    );
  }

  const topArtist = stats.top_artists?.[0] || { name: "Unknown Artist", image: "" };
  const topTrack = stats.top_tracks?.[0] || { name: "Unknown Track", artist: "Unknown" };
  const topGenre = stats.top_genres?.[0]?.name || "Unknown";

  return (
    <div className="py-12 space-y-8 animate-in fade-in">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
          Share Your Stats
        </h1>
        <p className="text-white/60">
          Download and share your music personality with the world
        </p>
      </header>

      <ShareableStatsCard
        userName={stats.userName || "Music Lover"}
        topArtist={topArtist}
        topTrack={topTrack}
        diversityScore={stats.diversity_score || 0}
        topGenre={topGenre}
      />
    </div>
  );
}
