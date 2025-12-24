import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { SyncService } from "@/services/syncService";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Trigger Sync
    // We treat the session ID as spotify ID for now, 
    // though ideally we should extract it more robustly if needed.
    // NextAuth default user object might need more fields mapped if `id` is missing.
    // But for Spotify provider, usually `id` is the spotify ID.
    
    // Fallback: If session.user.id is missing (depends on callback), we might need to fetch profile again
    // But SyncService fetches profile anyway.
    
    // We pass a dummy ID if session.user.id is missing, SyncService will update it from fresh profile fetch
    const spotifyId = session.user.id || "unknown"; 

    const result = await SyncService.syncUserData(
      session.accessToken,
      spotifyId,
      session.user.email
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
