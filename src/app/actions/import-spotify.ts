
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import AdmZip from "adm-zip";

export async function importSpotifyData(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return { error: "No file provided" };
  }

  if (!supabaseAdmin) {
    console.error("Supabase Admin client not initialized");
    return { error: "Server configuration error" };
  }

  try {
     // Get user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return { error: "User not found" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let historyItems: any[] = [];
    let processedFiles = 0;

    console.log(`Processing upload (Action): ${file.name}, size: ${buffer.length}`);

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
            if (!entry.isDirectory && entry.entryName.toLowerCase().endsWith(".json")) {
               const content = entry.getData().toString("utf8");
               if (processJsonContent(content, entry.entryName)) {
                   processedFiles++;
               }
            }
        }
      } catch (zipError) {
        console.error("Error reading zip:", zipError);
        return { error: "Invalid Zip File" };
      }
    } else if (file.name.toLowerCase().endsWith(".json")) {
        const content = buffer.toString("utf8");
        if (processJsonContent(content, file.name)) {
            processedFiles++;
        }
    } else {
        return { error: "Unsupported file type. Please upload .zip or .json" };
    }

    if (historyItems.length === 0) {
        return { 
            error: "No valid streaming history found. Check if the zip contains JSON files." 
        };
    }

    // Process and normalize data
    const normalizedData = historyItems.map((item, index) => {
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
        
        // Extended Format 
        if (item.ts) {
            // Must have a track name.
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
        return null; 
    }).filter((item): item is NonNullable<typeof item> => {
        if (!item) return false;
        return item.ms_played > 30000; // 30s threshold
    });

    if (normalizedData.length === 0) {
         return { 
            error: "Found JSON data but no valid music tracks (possibly only podcasts or short plays)." 
        };
    }

    // Batch insert
    const BATCH_SIZE = 1000;
    let insertedCount = 0;
    
    // Using simple loop for batching
    for (let i = 0; i < normalizedData.length; i += BATCH_SIZE) {
        const batch = normalizedData.slice(i, i + BATCH_SIZE);
        const { error } = await supabaseAdmin
            .from("streaming_history")
            .insert(batch);
        
        if (error) {
            console.error("Batch insert error:", error);
            if (insertedCount === 0) {
                 return { error: `Database error: ${error.message}` };
            }
            break;
        } else {
            insertedCount += batch.length;
        }
    }

    return { 
        success: true, 
        count: insertedCount,
        message: `Imported ${insertedCount} tracks successfully` 
    };

  } catch (error: any) {
    console.error("Import Action error:", error);
    return { error: `Internal Error: ${error.message}` };
  }
}
