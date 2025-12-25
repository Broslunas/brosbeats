
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import AdmZip from "adm-zip";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error: Missing Service Role Key" }, { status: 500 });
    }

    // Get user ID
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let historyItems: any[] = [];

    // Determine file type
    if (file.name.endsWith(".zip")) {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      for (const entry of zipEntries) {
        if (!entry.isDirectory && entry.entryName.endsWith(".json")) {
           // We look for relevant JSON files
           // Standard: StreamingHistory0.json
           // Extended: endsong_0.json
           // We will try to detect the schema based on content of first item
           try {
             const content = entry.getData().toString("utf8");
             const json = JSON.parse(content);
             
             if (Array.isArray(json)) {
                historyItems.push(...json);
             }
           } catch (e) {
             console.log("Error parsing json in zip", entry.entryName);
           }
        }
      }
    } else if (file.name.endsWith(".json")) {
        const content = buffer.toString("utf8");
        const json = JSON.parse(content);
        if (Array.isArray(json)) {
            historyItems = json;
        }
    } else {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    console.log(`Found ${historyItems.length} items to process`);
    
    // Process and normalize data
    const normalizedData = historyItems.map((item) => {
        // Standard Format
        if (item.endTime && item.artistName && item.trackName) {
            return {
                user_id: user.id,
                played_at: item.endTime, // "2023-01-01 12:00"
                artist_name: item.artistName,
                track_name: item.trackName,
                ms_played: item.msPlayed,
                // album_name not valid in standard
                platform: "spotify_import_standard"
            };
        }
        // Extended Format (endsong_*.json)
        if (item.ts && item.master_metadata_track_name && item.master_metadata_album_artist_name) {
            if (!item.master_metadata_track_name) return null; // skipped tracks often have null
            return {
                user_id: user.id,
                played_at: item.ts, // ISO string
                artist_name: item.master_metadata_album_artist_name,
                track_name: item.master_metadata_track_name,
                album_name: item.master_metadata_album_album_name,
                ms_played: item.ms_played,
                spotify_track_uri: item.spotify_track_uri,
                platform: item.platform || "spotify_import_extended",
                // ip_addr: item.ip_addr
            };
        }
        return null;
    }).filter(item => item !== null && item.ms_played > 30000); // Filter short plays (30s) if desired, or keep all. Let's keep > 0 or consistent with behavior.

    // Batch insert
    const BATCH_SIZE = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < normalizedData.length; i += BATCH_SIZE) {
        const batch = normalizedData.slice(i, i + BATCH_SIZE);
        const { error } = await supabaseAdmin!
            .from("streaming_history")
            .insert(batch);
        
        if (error) {
            console.error("Batch insert error:", error);
            // continue or fail?
        } else {
            insertedCount += batch.length;
        }
    }

    return NextResponse.json({ 
        success: true, 
        count: insertedCount,
        message: `Imported ${insertedCount} tracks successfully` 
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
