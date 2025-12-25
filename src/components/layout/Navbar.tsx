"use client";

import { Menu, Home, BarChart2, MessageSquare, Settings, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../ThemeToggle";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { status } = useSession();

  if (status !== "authenticated") return null;

  return (
    <nav className="md:hidden fixed top-0 w-full z-50 px-4 py-3">
      <div className="mx-auto max-w-7xl glass-panel rounded-full px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
           {/* Logo placeholder */}
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center font-bold text-xs">
             AI
           </div>
           <span className="font-bold text-sm tracking-wide">Spotify AI</span>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-16 right-4 w-48 glass-panel rounded-2xl p-2 flex flex-col gap-1 animate-in slide-in-from-top-2 fade-in duration-200">
           <NavLink href="/" icon={Home} label="Home" />
           <NavLink href="/stats" icon={BarChart2} label="Stats" />
           <NavLink href="/share" icon={Share2} label="Share" />
           <NavLink href="/chat" icon={MessageSquare} label="AI Chat" />
           <NavLink href="/settings" icon={Settings} label="Settings" />
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 text-sm transition-colors text-white/80 hover:text-white"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )
}
