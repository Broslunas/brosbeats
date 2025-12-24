"use client";

import { GlassWidget } from "../ui/GlassWidget";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Headphones, ExternalLink, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NowPlayingData {
  isPlaying: boolean;
  progressMs: number;
  track?: {
    id: string;
    name: string;
    artist: string;
    album: string;
    image: string;
    url: string;
    durationMs: number;
  };
}

export function NowPlayingWidget() {
  const [data, setData] = useState<NowPlayingData | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    async function fetchNowPlaying() {
      try {
        const res = await fetch("/api/spotify/now-playing");
        const json = await res.json();
        setData(json);
        if (json.progressMs) {
            setElapsed(json.progressMs);
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Update progress bar locally every second if playing
  useEffect(() => {
      if (data?.isPlaying) {
          const timer = setInterval(() => {
              setElapsed(prev => Math.min(prev + 1000, data.track?.durationMs || 0));
          }, 1000);
          return () => clearInterval(timer);
      }
  }, [data?.isPlaying, data?.track?.durationMs]);

  if (!data?.isPlaying || !data.track) return null;

  const progressPercent = (elapsed / data.track.durationMs) * 100;

  return (
    <GlassWidget className="md:col-span-4 row-span-1 relative overflow-hidden group min-h-[160px]">
      {/* Background with blur */}
      <div className="absolute inset-0">
          <Image 
            src={data.track.image} 
            alt="Blur" 
            fill 
            className="object-cover blur-2xl opacity-40 scale-110"
          />
          <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 p-5 flex items-center gap-5 h-full">
         {/* Album Art with Pulse */}
         <div className="relative w-24 h-24 flex-shrink-0">
            <motion.div 
               animate={{ scale: [1, 1.05, 1] }} 
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               className="absolute inset-0 bg-white/20 rounded-lg blur-md"
            />
            <Image 
                src={data.track.image} 
                alt={data.track.name} 
                fill 
                className="object-cover rounded-lg shadow-2xl relative z-10"
            />
         </div>

         <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
             <div className="flex items-center gap-2">
                 <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                     <Headphones className="w-3 h-3" /> Now Playing
                 </span>
             </div>
             
             <h3 className="text-xl font-bold truncate text-white leading-tight mt-1">{data.track.name}</h3>
             <p className="text-white/70 truncate text-sm">{data.track.artist}</p>
             
             {/* Progress Bar */}
             <div className="mt-3 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                    className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                 />
             </div>
             <div className="flex justify-between text-[10px] text-white/40 mt-1 font-mono">
                 <span>{formatTime(elapsed)}</span>
                 <span>{formatTime(data.track.durationMs)}</span>
             </div>
         </div>
      </div>
    </GlassWidget>
  );
}

function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
}
