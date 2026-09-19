import { supabase } from '@/lib/supabase';
import type { Season, Week } from '@/types/database';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Rounds an arbitrary date down to the Monday of its week (ISO week). */
export function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const isoDow = d.getUTCDay() === 0 ? 7 : d.getUTCDay(); // 1=Mon .. 7=Sun
  d.setUTCDate(d.getUTCDate() - (isoDow - 1));
  return d;
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

/** 0=Mon .. 6=Sun, matching daily_checkins.day_of_week. */
export function dayIndexOf(date: Date): number {
  const jsDay = date.getDay(); // 0=Sun .. 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1;
}

/** 1-indexed week number for `date` within a season starting on `startDate` (a Monday). */
export function weekNumberFor(startDate: string, date: Date): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const current = mondayOf(date);
  const diffWeeks = Math.round((current.getTime() - start.getTime()) / (DAY_MS * 7));
  return Math.max(1, diffWeeks + 1);
}

export async function createSeason(
  groupId: string,
  startDate: Date,
  weekCount: number,
): Promise<Season> {
  const start = mondayOf(startDate);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + weekCount * 7 - 1);

  const { data, error } = await supabase
    .from('seasons')
    .insert({
      group_id: groupId,
      start_date: toDateString(start),
      end_date: toDateString(end),
      week_count: weekCount,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCurrentSeason(groupId: string): Promise<Season | null> {
  const { data, error } = await supabase
    .from('seasons')
    .select()
    .eq('group_id', groupId)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Fetches this season's week for `date`, creating it (rollover) if it doesn't exist yet. */
export async function getOrCreateCurrentWeek(season: Season, date = new Date()): Promise<Week> {
  const weekNumber = weekNumberFor(season.start_date, date);
  const weekStart = mondayOf(date);

  const { data: existing, error: findError } = await supabase
    .from('weeks')
    .select()
    .eq('season_id', season.id)
    .eq('week_number', weekNumber)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('weeks')
    .insert({
      season_id: season.id,
      week_number: weekNumber,
      week_start_date: toDateString(weekStart),
    })
    .select()
    .single();
  if (insertError) throw insertError;
  return created;
}
