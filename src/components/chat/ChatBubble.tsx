"use client";

import { useChatStore } from "@/store/useChatStore";
import { MessageSquare, X, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ChatBubble() {
  const { isOpen, toggleOpen, messages, addMessage, isLoading, setLoading } = useChatStore();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const userMsg = inputValue;
    setInputValue("");
    addMessage("user", userMsg);
    setLoading(true);

    // Simulate AI response for now
    setTimeout(() => {
      addMessage("assistant", `I saw you said: "${userMsg}". Real analysis coming soon!`);
      setLoading(false);
    }, 1500);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 md:right-8 w-[90vw] md:w-[400px] h-[500px] glass-panel rounded-2xl flex flex-col z-50 overflow-hidden border border-white/10 shadow-2xl"
          >
             {/* Header */}
             <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="font-semibold text-sm">AI Assistant</span>
                </div>
                <button onClick={toggleOpen} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5 text-white/70" />
                </button>
             </div>

             {/* Messages */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      msg.role === 'user' 
                        ? "bg-green-600 text-white rounded-tr-sm" 
                        : "bg-white/10 text-white/90 rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                     <div className="bg-white/10 rounded-2xl px-4 py-2 rounded-tl-sm flex gap-1">
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms"}} />
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms"}} />
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms"}} />
                     </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
             </div>

             {/* Input */}
             <div className="p-4 border-t border-white/10 bg-black/20">
               <form 
                 onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                 className="flex items-center gap-2"
               >
                 <input
                   className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-white/30"
                   placeholder="Ask about your music..."
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                 />
                 <button 
                   type="submit"
                   disabled={!inputValue.trim() || isLoading}
                   className="p-2 bg-green-500 text-black rounded-full hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   <Send className="w-4 h-4 ml-0.5" />
                 </button>
               </form>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleOpen}
        className={cn(
            "fixed bottom-24 md:bottom-6 right-4 md:right-8 z-40 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 group",
            isOpen ? "bg-white/10 text-white" : "bg-green-500 text-black shadow-green-500/20"
        )}
      >
        {isOpen ? (
            <X className="w-6 h-6" />
        ) : (
            <MessageSquare className="w-6 h-6 fill-current" />
        )}
      </button>
    </>
  );
}
