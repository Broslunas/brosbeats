import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Dock } from "@/components/layout/Dock";
import { Footer } from "@/components/layout/Footer";
import { ChatBubble } from "@/components/chat/ChatBubble";

import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "BrosBeats - AI Powered Spotify Analytics",
  description: "Analyze your music taste, discover your true top artists, and share your stats with BrosBeats.",
  icons: {
    icon: "https://cdn.broslunas.com/favicon.ico",
    shortcut: "https://cdn.broslunas.com/favicon.ico",
    apple: "https://cdn.broslunas.com/favicon.png",
  },
  openGraph: {
    title: "BrosBeats - AI Powered Spotify Analytics",
    description: "Analyze your music taste and discover your true top artists.",
    url: "https://brosbeats.com",
    siteName: "BrosBeats",
    images: [
      {
        url: "https://cdn.broslunas.com/brosbeats-og.jpg", // Placeholder for now or generic
        width: 1200,
        height: 630,
      },
    ],
    locale: "es_ES",
    type: "website",
  },
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
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
