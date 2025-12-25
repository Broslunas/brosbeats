"use client";

import { GlassWidget, GlassHeader, GlassContent } from "@/components/ui/GlassWidget";
import { User, Lock, Globe, Users, LogOut, Save, Upload, FileJson } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { importSpotifyData } from "@/app/actions/import-spotify"; // Server Action

interface SettingsFormProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  initialPrivacy: "private" | "mixed" | "public";
}

export function SettingsForm({ user, initialPrivacy }: SettingsFormProps) {
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [isSaving, setIsSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privacy }),
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      router.refresh();
      // Optional: Show toast success
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus("Uploading & Processing...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Use Server Action directly
      const result = await importSpotifyData(null, formData);
      
      if (result.error) throw new Error(result.error);
      
      setImportStatus(`Success! Imported ${result.count} tracks.`);
            // Clear status after 5s
      setTimeout(() => setImportStatus(null), 5000);
      router.refresh();
    } catch (err: any) {
      console.error("Import error:", err);
      setImportStatus(`Error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Section */}
      <GlassWidget>
        <GlassHeader className="flex items-center gap-2">
            <User className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold">Profile</h3>
        </GlassHeader>
        <GlassContent className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-green-500/30">
                <Image src={user.avatar || "/placeholder.png"} alt={user.name} fill className="object-cover" />
            </div>
            <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-white/50 text-sm">{user.email}</p>
                <div className="mt-2 text-xs bg-white/10 px-2 py-1 rounded inline-block text-white/70">
                    Spotify Connected
                </div>
            </div>
        </GlassContent>
      </GlassWidget>

      {/* Privacy Section */}
      <GlassWidget>
        <GlassHeader className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Privacy Settings</h3>
        </GlassHeader>
        <GlassContent className="space-y-4">
            <p className="text-sm text-white/60 mb-4">
                Control who can see your stats and analysis.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <PrivacyOption 
                    icon={Lock} 
                    label="Private" 
                    description="Only you"
                    isActive={privacy === 'private'}
                    onClick={() => setPrivacy('private')}
                />
                <PrivacyOption 
                    icon={Users} 
                    label="Friends" 
                    description="Mutual follows"
                    isActive={privacy === 'mixed'}
                    onClick={() => setPrivacy('mixed')}
                />
                <PrivacyOption 
                    icon={Globe} 
                    label="Public" 
                    description="Anyone with link"
                    isActive={privacy === 'public'}
                    onClick={() => setPrivacy('public')}
                />
            </div>
            
            <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </GlassContent>
      </GlassWidget>

      {/* Data Import Section */}
      <GlassWidget>
        <GlassHeader className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Import Data</h3>
        </GlassHeader>
        <GlassContent className="space-y-4">
            <p className="text-sm text-white/60">
                Import your Spotify streaming history (.zip or .json) to populate your stats.
                Downloads from Spotify Privacy settings are supported.
            </p>
            
            <div className="relative group">
                <input 
                    type="file" 
                    accept=".zip,.json"
                    onChange={handleFileUpload}
                    disabled={importing}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                />
                <div className={`border-2 border-dashed rounded-xl p-8 transition-colors text-center ${
                    importing 
                    ? 'border-blue-500/50 bg-blue-500/5' 
                    : 'border-white/10 group-hover:border-blue-400/50 group-hover:bg-white/5'
                }`}>
                    <div className="flex flex-col items-center gap-3">
                        <div className={`p-3 rounded-full ${importing ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                            <FileJson className={`w-6 h-6 ${importing ? 'text-blue-400' : 'text-white/40'}`} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">
                                {importing ? 'Processing...' : 'Drop your file here'}
                            </p>
                            <p className="text-xs text-white/40">
                                {importStatus || "Supports Standard & Extended History"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </GlassContent>
      </GlassWidget>

      {/* Danger Zone */}
      <GlassWidget className="border-red-500/20">
        <GlassHeader className="flex items-center gap-2 border-red-500/10">
            <LogOut className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-red-50 text-opacity-90">Account</h3>
        </GlassHeader>
        <GlassContent>
            <button 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                <LogOut className="w-4 h-4" />
                Sign Out
            </button>
        </GlassContent>
      </GlassWidget>
      
      <div className="text-center text-xs text-white/30">
        Version 1.0.0 • Connected to Spotify
      </div>
    </div>
  );
}

function PrivacyOption({ icon: Icon, label, description, isActive, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center p-4 rounded-xl border transition-all duration-300 ${
                isActive 
                ? 'bg-green-500/20 border-green-500 text-white' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white'
            }`}
        >
            <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-green-400' : 'text-current'}`} />
            <span className="font-semibold text-sm">{label}</span>
            <span className="text-xs opacity-70">{description}</span>
        </button>
    )
}
