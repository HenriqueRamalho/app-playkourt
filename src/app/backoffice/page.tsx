export default function BackofficePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-8">Visão geral da plataforma</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Venues ativos', value: '12' },
          { label: 'Reservas hoje', value: '34' },
          { label: 'Usuários cadastrados', value: '218' },
          { label: 'Receita do mês', value: 'R$ 8.400' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
