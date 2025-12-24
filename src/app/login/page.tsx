"use client";

import { signIn } from "next-auth/react";
import { GlassWidget } from "@/components/ui/GlassWidget";
import { Music2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const handleSpotifyLogin = () => {
    signIn("spotify", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <GlassWidget className="max-w-md w-full p-8 md:p-12 text-center space-y-8 animate-in zoom-in fade-in duration-500" intensity="high">
        
        {/* Logo/Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
            <Music2 className="w-10 h-10 text-black" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
            Spotify AI Stats
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            Discover your music personality with AI-powered insights
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3 text-sm text-white/70">
            <Sparkles className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Analyze your top artists, tracks & genres</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-white/70">
            <Sparkles className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Get personalized AI recommendations</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-white/70">
            <Sparkles className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>Track your listening diversity over time</span>
          </div>
        </div>

        {/* Spotify Login Button */}
        <button
          onClick={handleSpotifyLogin}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-6 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 group"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span>Continue with Spotify</span>
        </button>

        {/* Footer Note */}
        <p className="text-xs text-white/40 leading-relaxed">
          We only access your listening history and profile. We never post on your behalf or modify your playlists.
        </p>
      </GlassWidget>
    </div>
  );
}
