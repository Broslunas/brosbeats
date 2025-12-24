import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/SettingsForm";

async function getUserSettings(email: string) {
  if (!supabaseAdmin) return null;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, avatar_url")
    .eq("email", email)
    .single();

  if (!user) return null;

  const { data: settings } = await supabaseAdmin
    .from("privacy_settings")
    .select("status")
    .eq("user_id", user.id)
    .single();

  return {
    user: {
      name: user.name,
      email: email,
      avatar: user.avatar_url,
    },
    privacy: settings?.status || 'private',
  };
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/login");
  }

  const data = await getUserSettings(session.user.email);

  if (!data) {
    return <div>User check FAILED</div>; // Should handle more gracefully
  }

  return (
    <div className="py-12 px-4">
      <header className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-white/60">Manage your profile and preferences</p>
      </header>
      
      <SettingsForm 
        user={data.user} 
        initialPrivacy={data.privacy} 
      />
    </div>
  );
}
