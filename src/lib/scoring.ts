export const DAYS_PER_WEEK = 7;

export type CompletionStatus = 'red' | 'orange' | 'green';

/**
 * Matches the spreadsheet's fixed bands: <50% red, 50-80% orange, >80% green.
 * 50% and 80% themselves land on the lower/inclusive side, mirroring how the
 * original sheet's conditional formatting evaluated its thresholds.
 */
export function statusForPct(pct: number): CompletionStatus {
  if (pct > 0.8) return 'green';
  if (pct >= 0.5) return 'orange';
  return 'red';
}

export const statusColor: Record<CompletionStatus, string> = {
  red: '#D21F3C',
  orange: '#E08A1E',
  green: '#1E9E5A',
};

export interface GoalCheckins {
  /** true where the member ticked that goal on that day */
  completedDays: boolean[];
}

/**
 * Weekly % = total ticked days across a member's goals for the week,
 * divided by (goals that have text * 7). A goal row with no text set yet
 * is excluded from the denominator, same as the spreadsheet leaving blank
 * rows out of the % formula.
 */
export function weeklyPct(goals: GoalCheckins[]): number {
  if (goals.length === 0) return 0;
  const ticked = goals.reduce(
    (sum, goal) => sum + goal.completedDays.filter(Boolean).length,
    0,
  );
  return ticked / (goals.length * DAYS_PER_WEEK);
}

export function teamAveragePct(memberWeeklyPcts: number[]): number {
  if (memberWeeklyPcts.length === 0) return 0;
  return memberWeeklyPcts.reduce((sum, pct) => sum + pct, 0) / memberWeeklyPcts.length;
}

/**
 * Hundred-day % = weeks ticked / total weeks elapsed so far in the season
 * (not the full season length), so a goal set mid-season isn't penalized
 * for weeks before it existed.
 */
export function hundredDayPct(weeksTicked: number, weeksElapsed: number): number {
  if (weeksElapsed <= 0) return 0;
  return weeksTicked / weeksElapsed;
}

/** Consecutive days (walking backward from today) a goal was ticked without a gap. */
export function currentStreak(completedDays: boolean[]): number {
  let streak = 0;
  for (let i = completedDays.length - 1; i >= 0; i -= 1) {
    if (!completedDays[i]) break;
    streak += 1;
  }
  return streak;
}

/** True once a full day has passed with zero check-ins across all of a member's goals. */
export function hasMissedToday(goals: GoalCheckins[], todayIndex: number): boolean {
  if (goals.length === 0) return false;
  return goals.every((goal) => !goal.completedDays[todayIndex]);
}
