import { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { sql } from "@/lib/database";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Type for database user
interface DBUser {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url: string | null;
  is_deleted: boolean;
}

// Validation schema for credentials
const loginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Custom Credentials Provider (Email/Password)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginCredentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          throw new Error("Email and password are required");
        }

        try {
          // Query user from database
          const result = await sql`
            SELECT id, email, password_hash, full_name, avatar_url, is_deleted
            FROM users
            WHERE email = ${parsed.data.email.toLowerCase()}
            LIMIT 1
          `;

          if (!result || result.length === 0) {
            throw new Error("User not found");
          }

          const user = result[0] as DBUser;

          // Check if user is deleted
          if (user.is_deleted) {
            throw new Error("User account is deactivated");
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            parsed.data.password,
            user.password_hash
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.full_name,
            image: user.avatar_url,
          };
        } catch (error) {
          throw new Error(
            error instanceof Error ? error.message : "Authentication failed"
          );
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      if (account?.provider === "google" && user) {
        try {
          // Check if user exists via Google email
          const result = await sql`
            SELECT id, email, full_name, avatar_url, is_deleted, password_hash
            FROM users
            WHERE email = ${user.email!.toLowerCase()}
            LIMIT 1
          `;

          if (result && result.length > 0) {
            const existingUser = result[0] as DBUser & { password_hash: string };

            // Check if user is deleted
            if (existingUser.is_deleted) {
              throw new Error("User account is deactivated");
            }

            // Update user's avatar if Google provides one
            if (user.image && !existingUser.avatar_url) {
              await sql`
                UPDATE users
                SET avatar_url = ${user.image}
                WHERE id = ${existingUser.id}
              `;
            }

            // Link Google OAuth to existing account
            // If it's a credential account, update the password_hash to indicate OAuth is enabled
            if (existingUser.password_hash && existingUser.password_hash !== "google_oauth") {
              // Account exists with credentials - allow linking if user explicitly using Google
              console.log(`Linking Google OAuth to existing credentials account: ${existingUser.email}`);
            }

            token.id = existingUser.id.toString();
            token.email = existingUser.email;
          } else {
            // Create new user if not exists
            try {
              const newUserResult = await sql`
                INSERT INTO users (email, full_name, avatar_url, password_hash, created_at)
                VALUES (${user.email!.toLowerCase()}, ${user.name || "Google User"}, ${user.image || null}, 'google_oauth', NOW())
                RETURNING id, email
              `;

              if (newUserResult && newUserResult.length > 0) {
                const newUser = newUserResult[0];
                token.id = newUser.id.toString();
                token.email = newUser.email;
              }
            } catch (insertError: any) {
              // Handle duplicate key error - user might exist but query missed it
              if (insertError?.code === '23505') {
                console.warn(`Duplicate email during Google OAuth signup: ${user.email}`);
                // Try to fetch again
                const retryResult = await sql`
                  SELECT id, email
                  FROM users
                  WHERE email = ${user.email!.toLowerCase()}
                  LIMIT 1
                `;
                
                if (retryResult && retryResult.length > 0) {
                  const retryUser = retryResult[0];
                  token.id = retryUser.id.toString();
                  token.email = retryUser.email;
                }
              } else {
                throw insertError;
              }
            }
          }
        } catch (error) {
          console.error("Error in JWT callback:", error);
        }
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  trustHost: true,
  debug: process.env.NODE_ENV === "development",
} as unknown as NextAuthConfig;
