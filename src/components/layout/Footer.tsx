"use client";

import Link from "next/link";
import { Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
           <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center font-bold text-[10px] text-black">
                    BB
                </div>
                <span className="font-bold text-lg tracking-tight">BrosBeats</span>
           </div>
           <p className="text-xs text-white/40 max-w-[250px]">
             Discover your music DNA. Analyze your Spotify history with AI and share your true top artists.
           </p>
        </div>

        {/* Links */}
        <div className="flex gap-8 text-sm text-white/60">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>

        {/* Socials */}
        <div className="flex items-center gap-4">
            <a href="https://github.com/broslunas" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all">
                <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com/broslunas" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
            </a>
            <a href="mailto:hello@brosbeats.com" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all">
                <Mail className="w-4 h-4" />
            </a>
        </div>
      </div>
      
      <div className="border-t border-white/5 py-4 text-center text-[10px] text-white/20">
        © {new Date().getFullYear()} BrosBeats. All rights reserved. Not affiliated with Spotify AB.
      </div>
    </footer>
  );
}
