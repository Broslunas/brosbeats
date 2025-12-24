import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { spotifyApi } from "@/lib/spotify";
import { NextResponse } from "next/server";
import { mapTimeRangeToSpotify, TimeRange } from "@/lib/timeRangeUtils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // 'artists', 'tracks', 'albums'
  const range = searchParams.get("range") as TimeRange || "30d";
  const limit = 20;

  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const spotifyRange = mapTimeRangeToSpotify(range);
    let data;

    if (type === "artists") {
      const res = await spotifyApi.getTopArtists(session.accessToken, spotifyRange, limit);
      // Filter if range is very short (24h/7d) - Not perfect with just 'short_term' but best effort
      // In a real advanced app, we'd use recently_played for 24h
      data = res.items;
    } 
    else if (type === "tracks") {
       const res = await spotifyApi.getTopTracks(session.accessToken, spotifyRange, limit);
       data = res.items;
    }
    else if (type === "albums") {
       // Spotify doesn't have "Top Albums" endpoint. We emulate it from Top Tracks.
       const res = await spotifyApi.getTopTracks(session.accessToken, spotifyRange, 50); // Get more tracks to aggregate
       
       const albumMap = new Map();
       res.items.forEach((track) => {
         const album = track.album;
         if (!albumMap.has(album.id)) {
           albumMap.set(album.id, {
             ...album,
             count: 0
           });
         }
         albumMap.get(album.id).count++;
       });
       
       data = Array.from(albumMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } 
    else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ items: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
