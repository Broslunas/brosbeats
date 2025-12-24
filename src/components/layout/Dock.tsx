"use client";

import { Home, BarChart2, MessageSquare, Settings, User, Share2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

export function Dock() {
  const { data: session } = useSession();
  const [spotifyId, setSpotifyId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSpotifyId() {
      if (session?.user?.email) {
        // We can fetch this from our API or directly from Supabase if we have public read access
        // For security, let's use a small server utility or API route, BUT for simplicity now:
        // We will assume the user table is readable for authenticated users (as per RLS policy draft)
        const { data } = await supabase
            .from("users")
            .select("spotify_id")
            .eq("email", session.user.email)
            .single();
            
        if (data?.spotify_id) {
            setSpotifyId(data.spotify_id);
        }
      }
    }
    fetchSpotifyId();
  }, [session, supabase]);

  const profileLink = spotifyId ? `/user/${spotifyId}` : "/settings"; // Fallback to settings if ID not found yet

  return (
    <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
        <DockItem href="/" icon={Home} label="Home" />
        <DockItem href="/stats" icon={BarChart2} label="Stats" />
        <DockItem href="/share" icon={Share2} label="Share" />
        <DockItem href="/chat" icon={MessageSquare} label="AI Chat" />
        
        <div className="w-[1px] h-8 bg-white/10 mx-1" /> {/* Divider */}
        
        <ThemeToggle />
        <DockItem href={profileLink} icon={User} label="Profile" />
        <DockItem href="/settings" icon={Settings} label="Settings" />
      </div>
    </div>
  );
}

function DockItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link 
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative p-3 rounded-xl transition-all duration-300 hover:bg-white/10",
        isActive ? "bg-white/10" : "bg-transparent",
        isHovered && "scale-125" // Magnification effect
      )}
    >
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </div>
      <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-green-400" : "text-white/70 group-hover:text-white")} />
    </Link>
  )
}
