import NextAuth, { NextAuthOptions } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"
import { JWT } from "next-auth/jwt";

// Basic Token types
interface SpotifyToken extends JWT {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  error?: string;
  user?: any;
}

const refreshAccessToken = async (token: SpotifyToken): Promise<SpotifyToken> => {
  try {
    const url = "https://accounts.spotify.com/api/token";
    const basicAuth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
    };
  } catch (error) {
    console.error("Error refreshing Access Token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
};

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "user-read-email user-read-private user-top-read user-read-recently-played playlist-read-private",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "spotify" && account.access_token && user.email) {
        try {
          // Trigger sync in background (or await if we want to ensure data exists before redirect)
          // Awaiting it ensures the user exists in our DB before they hit the dashboard
          const { SyncService } = await import("@/services/syncService");
          await SyncService.syncUserData(
            account.access_token,
            user.id, // Spotify ID
            user.email
          );
        } catch (error) {
          console.error("Auto-sync failed on login:", error);
          // We don't block login if sync fails, but we log it.
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: Date.now() + (account.expires_in as number) * 1000,
          user,
        } as SpotifyToken;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token as SpotifyToken).expiresAt) {
        return token as SpotifyToken;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token as SpotifyToken);
    },
    async session({ session, token }) {
      // @ts-ignore
      session.user = (token as SpotifyToken).user;
      // @ts-ignore
      session.accessToken = (token as SpotifyToken).accessToken;
      // @ts-ignore
      session.error = (token as SpotifyToken).error;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
