import NextAuth, { type DefaultSession, type DefaultUser } from 'next-auth';
import authOptions from '../../../../lib/auth';

// 1. Lendo os e-mails autorizados do .env e criando um array de emails
const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.toLowerCase().split(',').map(email => email.trim())
  : [];

// Extensões de Tipagem (Seu código original)
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
    } & DefaultSession['user']
  }
  
  interface User extends DefaultUser {
    id: string
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
