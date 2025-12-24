"use client";

import { GlassWidget, GlassHeader } from "../ui/GlassWidget";
import { TimeRangeSelector } from "../TimeRangeSelector";
import { useState, useEffect } from "react";
import { Disc } from "lucide-react";
import { TimeRange } from "@/lib/timeRangeUtils";

export function TopGenresWidget() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/spotify/top?type=genres&range=${range}`);
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
    <GlassWidget className="md:col-span-1 row-span-1 p-5 overflow-hidden flex flex-col min-h-[300px]">
      <div className="flex flex-col gap-3 mb-2 border-b border-white/5 pb-2">
         <div className="flex items-center gap-2 text-white/70">
           <Disc className="w-4 h-4" />
           <span className="text-sm font-semibold">Top Genres</span>
         </div>
         <TimeRangeSelector value={range} onChange={setRange} className="w-full justify-between" />
      </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar">
         {loading ? (
             <div className="space-y-3 pt-2">
                 {[1,2,3,4,5].map(i => (
                     <div key={i} className="flex items-center justify-between">
                         <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                         <div className="h-1.5 w-16 bg-white/10 rounded-full" />
                     </div>
                 ))}
             </div>
         ) : (
           <ul className="space-y-3 pt-2">
             {data.slice(0, 10).map((genre: any, i: number) => (
               <li key={i} className="flex items-center justify-between text-sm group">
                 <span className="capitalize text-white/80 group-hover:text-green-400 transition-colors">{genre.name}</span>
                 <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                    {/* Visual bar based on relative popularity (assuming max count effectively) */}
                   <div 
                        className="h-full bg-white/50 group-hover:bg-green-400 transition-colors" 
                        style={{ width: `${Math.min(100, (genre.count / (data[0]?.count || 1)) * 100)}%` }} 
                   />
                 </div>
               </li>
             ))}
             {data.length === 0 && (
                 <li className="text-xs text-white/40 text-center py-4">No genres found for this period</li>
             )}
           </ul>
         )}
       </div>
    </GlassWidget>
  );
}
