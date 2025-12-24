import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { spotifyApi } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ isPlaying: false });
  }

  try {
    const data = await spotifyApi.getCurrentlyPlaying(session.accessToken);
    
    if (!data || !data.item) {
      return NextResponse.json({ isPlaying: false });
    }

    const track = data.item as SpotifyApi.TrackObjectFull;

    return NextResponse.json({
      isPlaying: data.is_playing,
      progressMs: data.progress_ms,
      track: {
        id: track.id,
        name: track.name,
        artist: track.artists.map(a => a.name).join(", "),
        album: track.album.name,
        image: track.album.images?.[0]?.url,
        url: track.external_urls.spotify,
        durationMs: track.duration_ms
      }
    });

  } catch (error) {
    console.error("Now Playing Error:", error);
    return NextResponse.json({ isPlaying: false });
  }
}
