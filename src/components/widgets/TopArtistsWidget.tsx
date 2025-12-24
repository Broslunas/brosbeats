"use client";

import { GlassWidget } from "../ui/GlassWidget";
import { TimeRangeSelector } from "../TimeRangeSelector";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Mic2, AlertCircle } from "lucide-react";
import { TimeRange } from "@/lib/timeRangeUtils";

export function TopArtistsWidget() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/spotify/top?type=artists&range=${range}`);
        const json = await res.json();
        if (json.items) setData(json.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  const topArtist = data[0];

  return (
    <GlassWidget className="relative overflow-hidden group h-full flex flex-col min-h-[160px]">
        {/* Background Image of #1 Artist */}
        {topArtist && (
             <div className="absolute inset-0 transition-opacity duration-700">
             <Image 
                 src={topArtist.images?.[0]?.url || '/placeholder.png'}
                 alt={topArtist.name}
                 fill
                 className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
         </div>
        )}

      <div className="relative z-10 flex flex-col h-full justify-between p-4">
        <div className="flex justify-between items-start">
             <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                <Mic2 className="w-3 h-3" /> #1 Artist
            </span>
             {/* Simple toggle for range might be too crowded in 1x1, let's keep it tight */}
             <TimeRangeSelector value={range} onChange={setRange} className="scale-75 origin-top-right gap-0 bg-black/40" />
        </div>
        
        <div className="mt-auto">
            {loading ? (
                <div className="animate-pulse space-y-2">
                    <div className="h-4 w-3/4 bg-white/20 rounded"/>
                    <div className="h-3 w-1/2 bg-white/20 rounded"/>
                </div>
            ) : topArtist ? (
                <>
                    <h2 className="text-2xl font-bold leading-tight truncate">{topArtist.name}</h2>
                    <p className="text-white/70 text-xs capitalize truncate">{topArtist.genres?.[0]}</p>
                </>
            ) : (
                 <div className="text-white/50 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4"/> No data
                 </div>
            )}
        </div>
      </div>
    </GlassWidget>
  );
}
