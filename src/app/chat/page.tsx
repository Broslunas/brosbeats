"use client";

import { useChatStore } from "@/store/useChatStore";
import { Send, Bot, User, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GlassHeader, GlassContent, GlassWidget } from "@/components/ui/GlassWidget";

export default function ChatPage() {
  const { messages, addMessage, isLoading, setLoading, clearHistory } = useChatStore();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const userMsg = inputValue;
    setInputValue("");
    addMessage("user", userMsg);
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      addMessage("assistant", `Extended analysis: You asked about "${userMsg}". Here is a detailed breakdown of your listening habits...`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in duration-500">
       <GlassWidget className="flex-1 flex flex-col overflow-hidden" intensity="high">
          <GlassHeader className="flex justify-between items-center bg-white/5">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-green-500/20 rounded-lg">
                 <Bot className="w-6 h-6 text-green-400" />
               </div>
               <div>
                 <h1 className="font-bold text-lg leading-tight">AI Music Analyst</h1>
                 <p className="text-xs text-white/50">Powered by OpenAI & Spotify Data</p>
               </div>
             </div>
             
             <button 
               onClick={clearHistory}
               className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-white/50"
               title="Clear Chat"
             >
               <Trash2 className="w-5 h-5" />
             </button>
          </GlassHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
             {messages.map((msg) => (
               <div key={msg.id} className={cn("flex gap-4 max-w-3xl mx-auto", msg.role === 'user' ? "flex-row-reverse" : "")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-white/10" : "bg-green-500/20"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-green-400" />}
                  </div>
                  
                  <div className={cn(
                    "rounded-2xl p-4 text-sm md:text-base leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-white/10 text-white" 
                      : "bg-transparent border border-white/5 text-white/90"
                  )}>
                    {msg.content}
                  </div>
               </div>
             ))}
             
             {isLoading && (
               <div className="flex gap-4 max-w-3xl mx-auto">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                     <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                     <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                     <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
               </div>
             )}
             <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/5 bg-white/5">
             <form 
               onSubmit={(e) => { e.preventDefault(); handleSend(); }}
               className="max-w-3xl mx-auto relative"
             >
               <input
                 className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-white/20"
                 placeholder="Ask specifically about an artist, genre, or time of day..."
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
               />
               <button 
                 type="submit" 
                 disabled={!inputValue.trim() || isLoading}
                 className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-500 text-black rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <Send className="w-4 h-4" />
               </button>
             </form>
          </div>
       </GlassWidget>
    </div>
  );
}
