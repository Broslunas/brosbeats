import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { privacy } = body;

    if (!['private', 'mixed', 'public'].includes(privacy)) {
        return NextResponse.json({ error: "Invalid privacy setting" }, { status: 400 });
    }

    // Get User ID
    const { data: user } = await supabaseAdmin!
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Upsert Privacy Settings
    const { error } = await supabaseAdmin!
      .from("privacy_settings")
      .upsert({ 
          user_id: user.id, 
          status: privacy,
          updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
