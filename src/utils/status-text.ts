// Turns a (possibly privacy-trimmed) travel status into the text shown in a
// status pill, e.g. "Traveling · Rome, Italy · until Nov 12". Shared between
// ProfileHeader (the real pill) and EditStatusPanel (the "they see: ..." preview).

import type { StatusSharing, TravelStatus, VisibleTravelStatus } from '@/types/profile';

// A date-only string ("2026-11-20" or "2026-12") as midnight in the phone's own
// timezone. new Date("2026-11-20") reads it as midnight UTC instead, which is
// still the day before anywhere west of London ("until Nov 19").
function localDate(isoDate: string): Date {
  const [year, month, day = 1] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// "Nov 20" from "2026-11-20"; "December" from "2026-12".
function formatUntil(isoDate: string): string {
  return localDate(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonth(isoMonth: string): string {
  return localDate(isoMonth).toLocaleDateString('en-US', { month: 'long' });
}

// Trims a status down to what one audience is allowed to see, from three
// independent choices (country/city/dates) instead of one ladder level.
// Dates only come through when country is also on. All three off is
// nothing at all -- no status pill. The database does the same before it
// sends anyone else's status (private.status_json in the people migration);
// this copy is for Edit profile's live "Close friends see: ..." previews.
export function trimStatus(status: TravelStatus, sharing: StatusSharing): VisibleTravelStatus | null {
  if (!sharing.country && !sharing.city && !sharing.dates) return null;
  if (status.kind === 'home') return status;

  const country = sharing.country ? status.country : undefined;
  const city = sharing.city ? status.city : undefined;
  const showDates = sharing.dates && sharing.country;

  if (status.kind === 'traveling') {
    return { kind: 'traveling', country, city, until: showDates ? status.until : undefined };
  }

  return { kind: 'planning', country, city, month: showDates ? status.month : undefined };
}

// Null when there's nothing to show (status hidden from this viewer).
export function formatStatusText(status: VisibleTravelStatus | null): string | null {
  if (!status) return null;
  if (status.kind === 'home') return 'Home';

  const label = status.kind === 'traveling' ? 'Traveling' : 'Planning';
  // Country and city are now independent -- either, both, or (rarely)
  // neither can be showing.
  const place = status.city && status.country ? `${status.city}, ${status.country}` : (status.city ?? status.country);

  if (status.kind === 'traveling' && status.until) {
    return place ? `${label} · ${place} · until ${formatUntil(status.until)}` : `${label} · until ${formatUntil(status.until)}`;
  }
  if (status.kind === 'planning' && status.month) {
    return place ? `${label} · ${place} · ${formatMonth(status.month)}` : `${label} · ${formatMonth(status.month)}`;
  }
  return place ? `${label} · ${place}` : label;
}
