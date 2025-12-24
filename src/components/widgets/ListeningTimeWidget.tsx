"use client";

import { GlassWidget } from "../ui/GlassWidget";
import { useState, useEffect } from "react";
import { Clock, History } from "lucide-react";

type TimeRange = "1h" | "24h" | "All"; // 'All' is limited to last 50 tracks via API

interface ListeningTimeWidgetProps {
    lifetimeMinutes?: number;
}

export function ListeningTimeWidget({ lifetimeMinutes = 0 }: ListeningTimeWidgetProps) {
  const [range, setRange] = useState<TimeRange>("24h");
  const [minutes, setMinutes] = useState(0);
  const [trackCount, setTrackCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // If "All", we use the passed prop (which comes from DB accumulator)
      // BUT we can't calculate "Total Tracks" easily for All time without a counter.
      // For now, if "All", we show minutes and maybe hide track count or show "Tracking since..."
      if (range === "All") {
          setMinutes(lifetimeMinutes);
          setLoading(false);
          return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/spotify/recently-played?limit=50`);
        const json = await res.json();
        
        if (json.items) {
          const now = new Date();
          const filtered = json.items.filter((item: any) => {
            const playedAt = new Date(item.played_at);
            if (range === "1h") {
               return (now.getTime() - playedAt.getTime()) < 60 * 60 * 1000;
            }
            if (range === "24h") {
               return (now.getTime() - playedAt.getTime()) < 24 * 60 * 60 * 1000;
            }
            return true;
          });

          const totalMs = filtered.reduce((acc: number, curr: any) => acc + curr.track.duration_ms, 0);
          setMinutes(Math.round(totalMs / 1000 / 60));
          setTrackCount(filtered.length);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range, lifetimeMinutes]);

  return (
    <GlassWidget className="p-5 flex flex-col justify-between h-full min-h-[160px] bg-gradient-to-br from-blue-500/10 to-transparent">
        <div className="flex justify-between items-start">
             <div className="flex items-center gap-2 text-blue-300">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-bold">Time Listened</span>
             </div>
             
             <div className="flex bg-black/20 rounded-lg p-1 gap-1">
                {(["1h", "24h", "All"] as TimeRange[]).map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`text-[10px] px-2 py-1 rounded transition-colors ${range === r ? "bg-white/20 text-white" : "text-white/40 hover:text-white"}`}
                    >
                        {r}
                    </button>
                ))}
             </div>
        </div>

        <div className="mt-4">
             {loading ? (
                 <div className="animate-pulse space-y-2">
                     <div className="h-8 w-20 bg-white/10 rounded" />
                     <div className="h-4 w-32 bg-white/10 rounded" />
                 </div>
             ) : (
                <>
                    <h3 className="text-4xl font-bold text-white mb-1">
                        {minutes} <span className="text-lg text-white/50 font-normal">min</span>
                    </h3>
                    <p className="text-xs text-blue-200/60 flex items-center gap-1">
                        <History className="w-3 h-3" />
                         Based on {trackCount} recent tracks
                    </p>
                </>
             )}
        </div>
    </GlassWidget>
  );
}
