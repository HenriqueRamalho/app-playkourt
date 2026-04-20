import { OverviewDTO, banLabel, formatDateTime } from './types';

interface Props {
  overview: OverviewDTO;
  onOpenVenues: () => void;
  onActionBan: () => void;
  onActionRevokeAll: () => void;
  onActionImpersonate: () => void;
  onActionResendVerification: () => void;
}

export function UserHeader({
  overview,
  onOpenVenues,
  onActionBan,
  onActionRevokeAll,
  onActionImpersonate,
  onActionResendVerification,
}: Props) {
  const initials = overview.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {overview.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={overview.image}
              alt={overview.name}
              className="w-16 h-16 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xl font-semibold">
              {initials || '?'}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{overview.name}</h1>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  overview.banned ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}
              >
                {banLabel(overview.banned, overview.banSource)}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-gray-700">
              <span>{overview.email}</span>
              {overview.emailVerified ? (
                <span className="text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                  verificado
                </span>
              ) : (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  não verificado
                </span>
              )}
            </div>

            <p className="mt-1 text-xs font-mono text-gray-500" title={overview.id}>
              {overview.id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ActionButton label={overview.banned ? 'Desbanir' : 'Banir'} onClick={onActionBan} tone="danger" />
          <ActionButton label="Deslogar de todos" onClick={onActionRevokeAll} />
          <ActionButton
            label="Logar como"
            onClick={onActionImpersonate}
            disabled={overview.banned}
          />
          {!overview.emailVerified && (
            <ActionButton label="Reenviar verificação" onClick={onActionResendVerification} />
          )}
        </div>
      </div>

      {overview.banned && overview.banReason && (
        <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          Motivo do banimento: {overview.banReason}
          {overview.bannedAt && (
            <span className="text-red-600/70"> · desde {formatDateTime(overview.bannedAt)}</span>
          )}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <MetaCell label="Cadastro" value={formatDateTime(overview.createdAt)} />
        <MetaCell label="Atualização" value={formatDateTime(overview.updatedAt)} />
        <MetaCell label="Último acesso" value={formatDateTime(overview.lastSeenAt)} />
        <MetaCell
          label="Provedores"
          value={overview.providers.length ? overview.providers.join(', ') : '—'}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={onOpenVenues}
          className="text-left bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
        >
          <p className="text-xs text-gray-500">Venues (dono)</p>
          <p className="text-lg font-semibold text-gray-900">{overview.venuesOwnedCount}</p>
        </button>
        <button
          type="button"
          onClick={onOpenVenues}
          className="text-left bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
        >
          <p className="text-xs text-gray-500">Venues (membro)</p>
          <p className="text-lg font-semibold text-gray-900">{overview.venuesMemberCount}</p>
        </button>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Reservas</p>
          <p className="text-lg font-semibold text-gray-900">{overview.bookingsCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500">Pagamentos</p>
          <p className="text-lg font-semibold text-gray-400">
            {overview.paymentsCount ?? 'Em breve'}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  tone,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  const base =
    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const classes =
    tone === 'danger'
      ? `${base} bg-red-50 text-red-700 hover:bg-red-100 border border-red-100`
      : `${base} bg-gray-100 text-gray-700 hover:bg-gray-200`;
  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-gray-800">{value}</p>
    </div>
  );
}
