import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[v0] Auth attempt for username:", credentials?.username);
        
        if (!credentials?.username || !credentials?.password) {
          console.log("[v0] Missing credentials");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });

          console.log("[v0] User found:", user ? "yes" : "no", user?.isActive ? "active" : "inactive");

          if (!user || !user.isActive) {
            console.log("[v0] User not found or inactive");
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          console.log("[v0] Password valid:", isValid);

          if (!isValid) {
            console.log("[v0] Invalid password");
            return null;
          }
        } catch (error) {
          console.log("[v0] Database error:", error);
          return null;
        }

        return {
          id: user.id,
          name: user.displayName,
          email: user.email,
          role: user.role,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
};
