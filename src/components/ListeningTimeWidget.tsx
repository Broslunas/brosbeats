"use client";

import { GlassWidget } from "./ui/GlassWidget";
import { Clock, Calendar, Headphones } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface ListeningTimeProps {
  totalMinutes: number;
  totalTracks: number;
}

export function ListeningTimeWidget({ totalMinutes, totalTracks }: ListeningTimeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const elements = containerRef.current.querySelectorAll('.stat-item');
    gsap.fromTo(
      elements,
      { opacity: 0, y: 20 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out"
      }
    );
  }, []);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  // Estimación: promedio 3.5 minutos por canción
  const estimatedMinutes = totalTracks * 3.5;

  return (
    <GlassWidget 
      ref={containerRef}
      className="md:col-span-2 row-span-1 p-6 bg-gradient-to-br from-green-500/10 via-transparent to-purple-500/10"
    >
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Headphones className="w-5 h-5 text-green-400" />
        Total Listening Time
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-item text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">{days}</div>
          <div className="text-xs text-white/50 mt-1">Days</div>
        </div>

        <div className="stat-item text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400">{remainingHours}</div>
          <div className="text-xs text-white/50 mt-1">Hours</div>
        </div>

        <div className="stat-item text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">{minutes}</div>
          <div className="text-xs text-white/50 mt-1">Minutes</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-white/40">
          Estimated from {totalTracks.toLocaleString()} tracks played
        </p>
      </div>
    </GlassWidget>
  );
}
