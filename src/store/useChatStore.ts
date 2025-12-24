import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I'm your Spotify AI Assistant. Ask me about your music taste, top tracks, or genre analysis.",
          timestamp: Date.now(),
        }
      ],
      isOpen: false,
      isLoading: false,

      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      
      addMessage: (role, content) => set((state) => ({
        messages: [
          ...state.messages, 
          { 
            id: crypto.randomUUID(), 
            role, 
            content, 
            timestamp: Date.now() 
          }
        ]
      })),

      setLoading: (loading) => set({ isLoading: loading }),
      clearHistory: () => set({ messages: [] }),
    }),
    {
      name: 'spotify-ai-chat-storage', // unique name
      partialize: (state) => ({ messages: state.messages }), // Only persist messages, not UI state like isOpen
    }
  )
);
