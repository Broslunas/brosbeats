"use client";

import { GlassWidget, GlassHeader, GlassContent } from "@/components/ui/GlassWidget";
import { TimeRangeSelector } from "@/components/TimeRangeSelector";
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
    <GlassWidget className="relative overflow-hidden group min-h-[360px] h-full">
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

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start p-4">
            <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <Mic2 className="w-3 h-3" /> Top Artists
            </span>
            <TimeRangeSelector value={range} onChange={setRange} />
        </div>
        
        <div className="flex-1 flex flex-col justify-end p-6">
            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-1/2 bg-white/20 rounded"/>
                    <div className="h-4 w-1/3 bg-white/20 rounded"/>
                </div>
            ) : topArtist ? (
                <>
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">{topArtist.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                         <span className="text-white/70 text-sm font-medium">#{topArtist.popularity} Popularity</span>
                         <span className="text-white/40">•</span>
                         <span className="text-white/70 text-sm capitalize">{topArtist.genres?.[0]}</span>
                    </div>
                </>
            ) : (
                 <div className="text-white/50 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5"/> No data for this period
                 </div>
            )}
        </div>
      </div>
    </GlassWidget>
  );
}
