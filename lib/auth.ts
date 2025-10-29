import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import type { AuthOptions } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.toLowerCase().split(',').map((email) => email.trim())
  : [];

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('As variáveis de ambiente GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não foram definidas.');
}
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  throw new Error('A variável de ambiente AUTH_SECRET ou NEXTAUTH_SECRET não foi definida.');
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        return true;
      }
      return '/auth/error?error=AccessDenied';
    },
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id ?? (token as any).sub ?? '';
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};

export default authOptions;
