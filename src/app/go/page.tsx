export default function GoPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Explorar quadras</h1>
      <p className="text-gray-500 text-sm mb-8">Encontre e reserve quadras perto de você.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
        <span className="text-4xl mb-4">🏐</span>
        <p className="text-gray-500 text-sm">Nenhuma quadra disponível no momento.</p>
      </div>
    </div>
  );
}
