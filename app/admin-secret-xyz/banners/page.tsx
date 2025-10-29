import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

export default function BannersPage() {
  // TODO: Implementar a listagem e gerenciamento de banners
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Banners</h1>
        <Link
          href="/admin-secret-xyz/banners/novo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <PlusCircle className="w-4 h-4" />
          Novo Banner
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Placeholder - adicione a listagem de banners aqui */}
        <div className="text-center py-8 text-muted-foreground">
          Em desenvolvimento...
        </div>
      </div>
    </div>
  );
}