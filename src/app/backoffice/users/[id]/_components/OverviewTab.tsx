import { OverviewDTO, formatDate, formatDateTime } from './types';

interface Props {
  overview: OverviewDTO;
}

export function OverviewTab({ overview }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Últimas reservas</h2>
        {overview.recentBookings.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma reserva registrada.</p>
        ) : (
          <ul className="space-y-2">
            {overview.recentBookings.map((booking) => (
              <li
                key={booking.id}
                className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {booking.courtName}{' '}
                    <span className="text-gray-500">· {booking.venueName}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(booking.date)} às {booking.startTime} · {booking.durationHours}h
                  </p>
                </div>
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                  {booking.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Última sessão ativa</h2>
        {overview.lastActiveSession ? (
          <dl className="text-sm space-y-2">
            <Row label="IP" value={overview.lastActiveSession.ipAddress ?? '—'} />
            <Row
              label="User agent"
              value={overview.lastActiveSession.userAgent ?? '—'}
              monospace
            />
            <Row
              label="Atualizada em"
              value={formatDateTime(overview.lastActiveSession.updatedAt)}
            />
          </dl>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma sessão ativa.</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, monospace }: { label: string; value: string; monospace?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="text-xs text-gray-500 w-28 shrink-0 pt-0.5">{label}</dt>
      <dd className={`text-gray-800 min-w-0 break-words ${monospace ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
