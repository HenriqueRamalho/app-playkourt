'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Phone } from 'lucide-react';

import { goService, VenueDetailDTO } from '@/infrastructure/frontend-services/api/go.service';
import { SportType, SPORT_TYPE_LABELS } from '@/domain/court/entity/court.interface';
import { DAY_OF_WEEK_LABELS } from '@/domain/venue/entity/venue.interface';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Filter = SportType | 'all';

export default function VenueSchedulingPage() {
  const { venueId } = useParams<{ venueId: string }>();

  const [detail, setDetail] = useState<VenueDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<Filter>('all');

  useEffect(() => {
    goService
      .getVenueWithCourts(venueId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar o local'))
      .finally(() => setLoading(false));
  }, [venueId]);

  return (
    <div className="mx-auto max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2.5 text-muted-foreground hover:text-foreground"
        nativeButton={false}
        render={<Link href="/go" />}
      >
        <ArrowLeft data-icon="inline-start" />
        Voltar para busca
      </Button>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Não foi possível carregar o local</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <VenueSchedulingSkeleton />
      ) : detail?.venue ? (
        <VenueSchedulingContent
          detail={detail}
          filter={sportFilter}
          onFilterChange={setSportFilter}
        />
      ) : null}
    </div>
  );
}

function VenueSchedulingContent({
  detail,
  filter,
  onFilterChange,
}: {
  detail: VenueDetailDTO;
  filter: Filter;
  onFilterChange: (value: Filter) => void;
}) {
  const { venue, courts, images } = detail;

  const availableSports = [...new Set(courts.map((c) => c.sportType))];
  const filtered = filter === 'all' ? courts : courts.filter((c) => c.sportType === filter);

  const streetLine = [venue.street, venue.number].filter(Boolean).join(', ');
  const addressLine = [streetLine, venue.neighborhood, venue.cityName, venue.stateUf]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{venue.name}</h1>
        {addressLine && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span>{addressLine}</span>
          </p>
        )}
        {venue.phone && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="size-3.5 shrink-0" />
            <span>{venue.phone}</span>
          </p>
        )}
      </header>

      {images.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fotos do local
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((img, idx) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={img.publicUrl}
                src={img.publicUrl}
                alt={img.originalName ?? venue.name}
                loading={idx === 0 ? 'eager' : 'lazy'}
                className="aspect-video w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {venue.businessHours?.length > 0 && (
        <Card size="sm" className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Clock className="size-3.5" />
              Horário de funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {venue.businessHours.map((h) => (
                <div key={h.dayOfWeek} className="flex items-center gap-2 text-sm">
                  <dt className="w-10 text-muted-foreground">{DAY_OF_WEEK_LABELS[h.dayOfWeek]}</dt>
                  <dd className="text-xs">
                    {h.isClosed ? (
                      <Badge variant="destructive">Fechado</Badge>
                    ) : (
                      <span className="text-foreground tabular-nums">
                        {h.openTime} – {h.closeTime}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {availableSports.length > 0 && (
        <ToggleGroup
          value={[filter]}
          onValueChange={(values) => onFilterChange((values[0] as Filter) ?? 'all')}
          variant="outline"
          size="sm"
          spacing={2}
          className="mb-5 flex-wrap"
          aria-label="Filtrar por modalidade"
        >
          <ToggleGroupItem value="all">Todas</ToggleGroupItem>
          {availableSports.map((sport) => (
            <ToggleGroupItem key={sport} value={sport}>
              {SPORT_TYPE_LABELS[sport]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      {filtered.length === 0 ? (
        <Card className="py-10">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <span className="text-4xl" aria-hidden>
              🏟️
            </span>
            <p className="text-sm text-muted-foreground">
              Nenhuma quadra disponível para esta modalidade.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((court) => (
            <li key={court.id}>
              <Card size="sm">
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">{court.name}</span>
                      <Badge variant="secondary">{SPORT_TYPE_LABELS[court.sportType]}</Badge>
                    </div>
                    {court.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {court.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground tabular-nums">
                        R$ {court.pricePerHour.toFixed(2)}
                      </span>
                      <span> /h</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/go/scheduling/${court.id}`} />}
                  >
                    Reservar
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function VenueSchedulingSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-8">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/2" />
        <Skeleton className="mt-1.5 h-4 w-1/3" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="hidden aspect-video w-full rounded-xl sm:block" />
      </div>
      <div className="mb-5 flex gap-2">
        <Skeleton className="h-7 w-16 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
