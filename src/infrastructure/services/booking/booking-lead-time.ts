import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/** Fuso padrão do produto. */
export const PRODUCT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte `date` (YYYY-MM-DD) + `startTime` (HH:mm) no fuso do produto para Date UTC.
 * Usa `fromZonedTime` (date-fns-tz) para lidar com DST corretamente.
 */
export function parseBookingStartUtc(date: string, startTime: string, tz = PRODUCT_TIMEZONE): Date {
  // Monta um ISO-like local: "2025-04-22T21:00"
  const localIso = `${date}T${startTime.slice(0, 5)}`;
  return fromZonedTime(localIso, tz);
}

/**
 * "Agora" em UTC.
 * Recebe `now` como parâmetro para facilitar testes (injeção de relógio).
 */
export function assertMinBookingLead(
  bookingStartUtc: Date,
  minLeadMinutes: number,
  now: Date = new Date(),
): void {
  const earliestStart = new Date(now.getTime() + minLeadMinutes * 60_000);
  if (bookingStartUtc <= earliestStart) {
    const hours = minLeadMinutes / 60;
    const label =
      Number.isInteger(hours)
        ? `${hours}h`
        : `${minLeadMinutes} min`;
    throw new Error(
      `Este horário exige antecedência mínima de ${label} para a reserva.`,
    );
  }
}

/** Exporta para facilitar tests (acesso ao fuso). */
export { toZonedTime };
