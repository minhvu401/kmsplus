import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export const GET = handlers.GET;
export const POST = handlers.POST;