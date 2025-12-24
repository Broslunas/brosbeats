import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Dock } from "@/components/layout/Dock";
import { ChatBubble } from "@/components/chat/ChatBubble";

import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Spotify AI Stats",
  description: "Analyze your music with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased min-h-screen text-foreground pb-24 md:pb-0">
        <Providers>
          <Navbar />
          
          <main className="pt-20 md:pt-12 px-4 md:px-8 max-w-7xl mx-auto">
            {children}
          </main>
          
          <Dock />
          <ChatBubble />
        </Providers>
      </body>
    </html>
  );
}
