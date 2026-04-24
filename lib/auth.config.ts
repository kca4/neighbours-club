import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config — no Node.js-only imports (no Prisma, no bcrypt).
 * Used in middleware.ts (Edge Runtime) and spread into the full auth.ts config.
 */
export const authConfig = {
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        // user.role is added by our authorize() function; cast through unknown
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
