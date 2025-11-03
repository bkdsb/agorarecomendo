import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/api/auth/signin');
  }
  // Sem AdminLayout - renderiza direto sem sidebar
  return <>{children}</>;
}
