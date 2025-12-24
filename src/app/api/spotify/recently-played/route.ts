import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { spotifyApi } from "@/lib/spotify";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit: number = parseInt(searchParams.get("limit") || "50");

  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
     const res = await spotifyApi.getRecentlyPlayed(session.accessToken, limit);
     
     // Simplify response
     const items = res.items.map(item => ({
       track: {
         name: item.track.name,
         artist: item.track.artists[0].name,
         duration_ms: item.track.duration_ms,
         uri: item.track.uri
       },
       played_at: item.played_at
     }));

     return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
