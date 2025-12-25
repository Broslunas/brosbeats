
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
      console.error("Supabase Admin client not initialized");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Get user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let historyItems: any[] = [];
    let processedFiles = 0;

    console.log(`Processing upload: ${file.name}, size: ${buffer.length}`);

    // Helper to process JSON content
    const processJsonContent = (content: string, filename: string) => {
      try {
        const json = JSON.parse(content);
        if (Array.isArray(json)) {
            console.log(`File ${filename} contains ${json.length} array items.`);
            historyItems.push(...json);
            return true;
        }
      } catch (e) {
        console.warn(`Failed to parse JSON in ${filename}:`, e);
      }
      return false;
    };

    if (file.name.toLowerCase().endsWith(".zip")) {
      try {
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();
        
        console.log(`Zip contains ${zipEntries.length} entries.`);

        for (const entry of zipEntries) {
            console.log(`Entry: ${entry.entryName} (dir: ${entry.isDirectory})`);
            if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith(".json")) {
               const content = entry.getData().toString("utf8");
               if (processJsonContent(content, entry.entryName)) {
                   processedFiles++;
               }
            }
        }
      } catch (zipError) {
        console.error("Error reading zip:", zipError);
        return NextResponse.json({ error: "Invalid Zip File" }, { status: 400 });
      }
    } else if (file.name.toLowerCase().endsWith(".json")) {
        const content = buffer.toString("utf8");
        if (processJsonContent(content, file.name)) {
            processedFiles++;
        }
    } else {
        return NextResponse.json({ error: "Unsupported file type. Please upload .zip or .json" }, { status: 400 });
    }

    console.log(`Total raw items found: ${historyItems.length} from ${processedFiles} files.`);
    
    if (historyItems.length === 0) {
        return NextResponse.json({ 
            error: "No valid streaming history found in the provided file(s). Check if the zip contains JSON files." 
        }, { status: 400 });
    }

    // Process and normalize data
    const normalizedData = historyItems.map((item, index) => {
        // Log first few items for debugging
        if (index < 3) console.log(`Sample item ${index}:`, JSON.stringify(item));

        // Standard Format (StreamingHistoryX.json)
        if (item.endTime && item.artistName && item.trackName) {
            return {
                user_id: user.id,
                played_at: item.endTime, 
                artist_name: item.artistName,
                track_name: item.trackName,
                ms_played: item.msPlayed,
                platform: "spotify_import_standard"
            };
        }
        
        // Extended Format (endsong_X.json or Streaming_History_Video_X.json)
        // Note: Some files named "Video" actually contain audio tracks.
        // We look for 'ts' and valid metadata.
        if (item.ts) {
            // Must have a track name to be useful. 
            // Some entries are podcasts/videos with null track name but have episode_name.
            // We focus on music for now, so we require master_metadata_track_name.
            if (!item.master_metadata_track_name) return null; 

            return {
                user_id: user.id,
                played_at: item.ts,
                artist_name: item.master_metadata_album_artist_name || "Unknown Artist",
                track_name: item.master_metadata_track_name,
                album_name: item.master_metadata_album_album_name,
                ms_played: item.ms_played,
                spotify_track_uri: item.spotify_track_uri,
                platform: item.platform || "spotify_import_extended"
            };
        }
        return null; // Unknown schema or missing required fields
    }).filter((item): item is NonNullable<typeof item> => {
        // Filter out nulls and short plays
        if (!item) return false;
        return item.ms_played > 30000; // 30s threshold
    });

    console.log(`Normalized ${normalizedData.length} valid tracks.`);

    if (normalizedData.length === 0) {
         return NextResponse.json({ 
            error: "Found JSON data but no valid music tracks (possibly only podcasts or short plays)." 
        }, { status: 400 });
    }

    // Batch insert
    const BATCH_SIZE = 1000;
    let insertedCount = 0;
    
    // We can use upsert to avoid duplicates if we had a unique constraint on user_id + played_at
    // The schema has an index but not a unique constraint. 
    // Ideally we should delete overlapping time ranges or use ignore duplicates.
    // For now, simpler insert.
    
    for (let i = 0; i < normalizedData.length; i += BATCH_SIZE) {
        const batch = normalizedData.slice(i, i + BATCH_SIZE);
        const { error } = await supabaseAdmin
            .from("streaming_history")
            .insert(batch);
        
        if (error) {
            console.error("Batch insert error:", error);
            // We continue trying other batches? Or fail?
            // Let's stop and report partial success if any
            if (insertedCount === 0) {
                 return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
            }
            break;
        } else {
            insertedCount += batch.length;
        }
    }

    return NextResponse.json({ 
        success: true, 
        count: insertedCount,
        message: `Imported ${insertedCount} tracks successfully` 
    });

  } catch (error: any) {
    console.error("Import error details:", error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
