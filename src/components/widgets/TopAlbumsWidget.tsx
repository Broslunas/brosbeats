"use client";

import { GlassWidget, GlassHeader } from "../ui/GlassWidget";
import { TimeRangeSelector } from "../TimeRangeSelector";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Disc } from "lucide-react";
import { TimeRange } from "@/lib/timeRangeUtils";

export function TopAlbumsWidget() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/spotify/top?type=albums&range=${range}`);
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

  return (
    <GlassWidget className="md:col-span-1 md:row-span-1 overflow-hidden flex flex-col min-h-[300px]">
      <div className="p-4 border-b border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
             <span className="font-semibold flex items-center gap-2 text-sm">
                 <Disc className="w-4 h-4 text-purple-400" /> Top Albums
             </span>
        </div>
        <TimeRangeSelector value={range} onChange={setRange} className="w-full justify-between" />
      </div>

      <div className="overflow-y-auto flex-1 p-3 grid grid-cols-2 gap-3 content-start">
         {loading ? (
             Array.from({length: 4}).map((_, i) => (
                 <div key={i} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
             ))
         ) : (
             data.slice(0, 6).map((album: any) => (
                 <div key={album.id} className="group relative aspect-square rounded-lg overflow-hidden bg-black/20">
                     {album.images?.[0] && (
                        <Image 
                            src={album.images[0].url} 
                            alt={album.name} 
                            fill 
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                         <p className="text-xs font-bold text-white truncate">{album.name}</p>
                         <p className="text-[10px] text-white/70 truncate">{album.artists[0].name}</p>
                     </div>
                 </div>
             ))
         )}
      </div>
    </GlassWidget>
  );
}
