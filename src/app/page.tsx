import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="space-y-4">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-500 to-green-600">
          Spotify AI Stats
        </h1>
        <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed">
          Unlock deep insights into your music taste. Connect your Spotify account to reveal your true audio personality.
        </p>
      </div>

      <div className="flex gap-4">
        {session ? (
            <Link 
              href="/app" 
              className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-xl shadow-white/10"
            >
              Go to Dashboard
            </Link>
        ) : (
            <Link 
              href="/api/auth/signin" 
              className="px-8 py-4 bg-green-500 text-black font-bold rounded-full hover:scale-105 transition-transform shadow-xl shadow-green-500/20"
            >
              Connect with Spotify
            </Link>
        )}
      </div>

      { /* Feature Preview or Social Proof could go here */ }
      <div className="pt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-white/40 text-sm max-w-4xl">
         <div className="p-6 border border-white/5 rounded-2xl bg-white/5">
            <h3 className="text-white font-semibold mb-2 text-lg">Deep Analysis</h3>
            <p>Understand your listening habits with AI-powered insights.</p>
         </div>
         <div className="p-6 border border-white/5 rounded-2xl bg-white/5">
            <h3 className="text-white font-semibold mb-2 text-lg">Shareable Cards</h3>
            <p>Create beautiful cards to share your stats on social media.</p>
         </div>
         <div className="p-6 border border-white/5 rounded-2xl bg-white/5">
            <h3 className="text-white font-semibold mb-2 text-lg">AI Chat</h3>
            <p>Chat with an AI that knows your music taste perfectly.</p>
         </div>
      </div>
    </div>
  );
}
