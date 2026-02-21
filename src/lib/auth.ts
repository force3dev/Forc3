import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        
        const email = creds.email as string;
        const password = creds.password as string;
        
        const user = await prisma.user.findUnique({ 
          where: { email },
          include: { profile: true }
        });
        
        if (!user?.hashedPassword) return null;
        
        const isValid = await compare(password, user.hashedPassword);
        if (!isValid) return null;
        
        return { 
          id: user.id, 
          email: user.email, 
          name: user.name ?? undefined,
          onboardingDone: user.onboardingDone
        };
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days - stay logged in
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboardingDone = (user as any).onboardingDone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).onboardingDone = token.onboardingDone;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
