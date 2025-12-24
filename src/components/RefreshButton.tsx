"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function RefreshButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  const handleManualSync = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Sync failed. Please try again.");
      }
    } catch (error) {
      console.error("Manual sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button 
      onClick={handleManualSync} 
      disabled={isSyncing}
      className={cn(
        "text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1",
        isSyncing && "opacity-50 cursor-not-allowed"
      )}
    >
      <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
      {isSyncing ? "Refreshing..." : "Refresh Data"}
    </button>
  );
}
