"use client";

import { GlassWidget } from "@/components/ui/GlassWidget";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoadingState({ userName }: { userName?: string }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (res.ok) {
        // Refresh page to show new data
        router.refresh();
      } else {
        alert("Sync failed. Please try again.");
      }
    } catch (error) {
      console.error("Manual sync error:", error);
      alert("Sync failed. Please check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-refresh after 3 seconds to check if data appeared
  useState(() => {
    const timer = setTimeout(() => {
      router.refresh();
    }, 3000);
    return () => clearTimeout(timer);
  });

  return (
    <div className="text-center py-20 animate-in fade-in space-y-8">
      <h2 className="text-2xl font-bold">Welcome, {userName || "Friend"}!</h2>
      <p className="text-white/60 mb-8">We are crunching your numbers for the first time...</p>
      
      <GlassWidget className="p-8 max-w-md mx-auto flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-green-400 animate-pulse">Analyzing Library...</p>
        
        <div className="pt-4 border-t border-white/10 w-full">
          <p className="text-xs text-white/40 mb-3">Taking too long?</p>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </GlassWidget>
    </div>
  );
}
