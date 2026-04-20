import { VenuesDTO, formatDate } from './types';

interface Props {
  data: VenuesDTO | null;
  loading: boolean;
  error: string | null;
}

export function VenuesTab({ data, loading, error }: Props) {
  if (loading) return <EmptyState text="Carregando..." />;
  if (error) return <ErrorState text={error} />;
  if (!data) return null;

  const hasAny = data.owned.length > 0 || data.member.length > 0;
  if (!hasAny) return <EmptyState text="Este usuário não possui venues." />;

  return (
    <div className="space-y-4">
      <Section title={`Como dono (${data.owned.length})`}>
        {data.owned.length === 0 ? (
          <p className="text-sm text-gray-500 px-4 py-3">Nenhuma venue como dono.</p>
        ) : (
          <SimpleTable
            headers={['Nome', 'Cidade', 'UF', 'Ativo', 'Criada em']}
            rows={data.owned.map((venue) => [
              venue.name,
              venue.cityName,
              venue.stateUf,
              venue.isActive ? 'Sim' : 'Não',
              formatDate(venue.createdAt),
            ])}
          />
        )}
      </Section>

      <Section title={`Como membro (${data.member.length})`}>
        {data.member.length === 0 ? (
          <p className="text-sm text-gray-500 px-4 py-3">Nenhuma venue como membro.</p>
        ) : (
          <SimpleTable
            headers={['Nome', 'Papel', 'Cidade', 'UF', 'Ativo']}
            rows={data.member.map((venue) => [
              venue.name,
              venue.role,
              venue.cityName,
              venue.stateUf,
              venue.isActive ? 'Sim' : 'Não',
            ])}
          />
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <h2 className="font-semibold text-gray-900 px-4 py-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-2 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-gray-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-8 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}

function ErrorState({ text }: { text: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
      {text}
    </div>
  );
}
