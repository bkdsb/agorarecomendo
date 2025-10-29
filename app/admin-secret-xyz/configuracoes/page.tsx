import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Configurações</h1>
      
      <div className="max-w-2xl space-y-8">
        {/* Informações do Usuário */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Informações do Usuário</h2>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {session?.user?.name}</p>
            <p><strong>Email:</strong> {session?.user?.email}</p>
          </div>
        </section>

        {/* Links úteis */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Links Úteis</h2>
          <ul className="space-y-2">
            <li>
              <a 
                href="https://github.com/bkdsb" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                GitHub
              </a>
            </li>
            <li>
              <a 
                href="https://docs.github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Documentação
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}