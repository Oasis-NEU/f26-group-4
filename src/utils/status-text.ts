// Turns a (possibly privacy-trimmed) travel status into the text shown in a
// status pill, e.g. "Traveling · Rome, Italy · until Nov 12". Shared between
// ProfileHeader (the real pill) and EditStatusPanel (the "they see: ..." preview).

import type { StatusDetail, TravelStatus, VisibleTravelStatus } from '@/types/profile';

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

// Trims a status down to one sharing level: hidden -> nothing, country -> no
// city, city -> no dates, full -> everything. The database does the same before
// it sends anyone else's status (private.status_json in the people migration);
// this copy is for Edit profile's live "Close friends see: ..." previews.
export function trimStatusForLevel(status: TravelStatus, level: StatusDetail): VisibleTravelStatus | null {
  if (level === 'hidden') return null;
  if (status.kind === 'home') return status;

  const city = level === 'country' ? undefined : status.city;

  if (status.kind === 'traveling') {
    return { kind: 'traveling', country: status.country, city, until: level === 'full' ? status.until : undefined };
  }

  return { kind: 'planning', country: status.country, city, month: level === 'full' ? status.month : undefined };
}

// Null when there's nothing to show (status hidden from this viewer).
export function formatStatusText(status: VisibleTravelStatus | null): string | null {
  if (!status) return null;
  if (status.kind === 'home') return 'Home';

  const label = status.kind === 'traveling' ? 'Traveling' : 'Planning';
  const place = status.city ? `${status.city}, ${status.country}` : status.country;

  if (status.kind === 'traveling' && status.until) {
    return `${label} · ${place} · until ${formatUntil(status.until)}`;
  }
  if (status.kind === 'planning' && status.month) {
    return `${label} · ${place} · ${formatMonth(status.month)}`;
  }
  return `${label} · ${place}`;
}
