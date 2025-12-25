"use client";

import { GlassWidget } from "../ui/GlassWidget";
import { TimeRangeSelector } from "../TimeRangeSelector";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Mic2 } from "lucide-react";
import { TimeRange } from "@/lib/timeRangeUtils";

interface TopArtistsListWidgetProps {
  initialData?: any;
}

export function TopArtistsListWidget({ initialData }: TopArtistsListWidgetProps) {
  const [range, setRange] = useState<TimeRange>("30d");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
        // Map imported structure
        const mapped = initialData.map((a: any) => ({
            id: a.name, // Mock ID
            name: a.name,
            images: a.image ? [{ url: a.image }] : [],
            genres: ['Imported History'] 
        }));
        setData(mapped);
        setLoading(false);
        return;
    }

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
  }, [range, initialData]);

  return (
    <GlassWidget className="overflow-hidden flex flex-col h-full min-h-[360px]">
      <div className="p-4 border-b border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
             <span className="font-semibold flex items-center gap-2 text-sm">
                 <Mic2 className="w-4 h-4 text-purple-400" /> Top Artists
             </span>
        </div>
        <TimeRangeSelector value={range} onChange={setRange} className="w-full justify-between" />
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar max-h-[400px]">
        {loading ? (
             Array.from({length: 8}).map((_, i) => (
                 <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                     <div className="w-4 h-4 bg-white/10 rounded" />
                     <div className="w-10 h-10 bg-white/10 rounded-full" />
                     <div className="flex-1 space-y-2">
                         <div className="h-3 w-3/4 bg-white/10 rounded" />
                         <div className="h-2 w-1/2 bg-white/10 rounded" />
                     </div>
                 </div>
             ))
        ) : (
            data.map((artist: any, i: number) => (
                <div key={artist.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors group">
                  <div className="text-xs text-white/30 w-4 font-mono text-center">{i + 1}</div>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10 group-hover:scale-110 transition-transform border border-white/10">
                     {true && (
                       <Image src={artist.images?.[0]?.url || '/placeholder.png'} alt={artist.name} fill className="object-cover" />
                     )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate text-white/90 group-hover:text-purple-400 transition-colors">{artist.name}</div>
                    <div className="text-xs text-white/50 truncate capitalize">{artist.genres?.[0] || 'Unknown Genre'}</div>
                  </div>
                </div>
              ))
        )}
      </div>
    </GlassWidget>
  );
}
