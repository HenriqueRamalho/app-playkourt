import Link from 'next/link';

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Bem-vindo</h1>
      <p className="text-gray-500 text-sm mb-8">Gerencie seus locais e quadras.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Link
          href="/admin/venues"
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-green-300 transition-colors"
        >
          <p className="text-sm font-medium text-gray-700">Meus locais</p>
          <p className="text-xs text-gray-400 mt-1">Gerencie venues e quadras</p>
        </Link>
        <Link
          href="/admin/gallery"
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-green-300 transition-colors"
        >
          <p className="text-sm font-medium text-gray-700">Galeria de imagens</p>
          <p className="text-xs text-gray-400 mt-1">Envie e organize fotos para usar nos locais</p>
        </Link>
      </div>
    </div>
  );
}
