"use client";

import { GlassWidget } from "@/components/ui/GlassWidget";
import { Download, Share2, Music2 } from "lucide-react";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import Image from "next/image";

interface StatsCardProps {
  userName: string;
  topArtist: { name: string; image?: string };
  topTrack: { name: string; artist: string };
  diversityScore: number;
  topGenre: string;
}

export function ShareableStatsCard({ userName, topArtist, topTrack, diversityScore, topGenre }: StatsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!cardRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
      });
      
      // Auto download
      const link = document.createElement('a');
      link.download = `spotify-stats-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export image");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* The Card to Export */}
      <div 
        ref={cardRef} 
        className="w-[600px] h-[800px] mx-auto relative overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        }}
      >
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative h-full flex flex-col p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center">
                <Music2 className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Spotify AI Stats</h2>
                <p className="text-white/50 text-sm">2024 Wrapped</p>
              </div>
            </div>
          </div>

          {/* User Name */}
          <div className="mb-12">
            <p className="text-white/60 text-sm mb-2">Music Wrapped for</p>
            <h1 className="text-5xl font-bold text-white">{userName}</h1>
          </div>

          {/* Top Artist - Hero */}
          <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 mb-6">
            <p className="text-green-400 text-sm font-semibold mb-4">#1 TOP ARTIST</p>
            <div className="flex items-center gap-6">
              {topArtist.image && (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/10">
                  <Image src={topArtist.image} alt={topArtist.name} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-4xl font-bold text-white mb-2">{topArtist.name}</h3>
                <p className="text-white/60 capitalize">{topGenre}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <p className="text-white/50 text-xs mb-2">DIVERSITY SCORE</p>
              <p className="text-4xl font-bold text-purple-400">{Math.round(diversityScore * 100)}%</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <p className="text-white/50 text-xs mb-2">TOP GENRE</p>
              <p className="text-xl font-bold text-white capitalize line-clamp-2">{topGenre}</p>
            </div>
          </div>

          {/* Top Track */}
          <div className="bg-gradient-to-r from-green-500/10 to-transparent rounded-xl p-6 border border-green-500/20">
            <p className="text-green-400 text-xs font-semibold mb-2">FAVORITE TRACK</p>
            <p className="text-white font-bold text-lg">{topTrack.name}</p>
            <p className="text-white/60 text-sm">{topTrack.artist}</p>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-6 text-center text-white/30 text-xs">
            spotify-ai-stats.vercel.app
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          {isExporting ? "Exporting..." : "Download Image"}
        </button>
        
        <button
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-all border border-white/10"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'My Spotify Stats',
                text: `Check out my music stats!`,
              });
            } else {
              alert("Sharing not supported on this device");
            }
          }}
        >
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>
    </div>
  );
}
