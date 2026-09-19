import { describe, expect, it } from 'vitest';

import {
  currentStreak,
  hasMissedToday,
  hundredDayPct,
  statusForPct,
  teamAveragePct,
  weeklyPct,
} from '../scoring';

describe('statusForPct', () => {
  it('is red below 50%', () => {
    expect(statusForPct(0)).toBe('red');
    expect(statusForPct(0.49)).toBe('red');
  });

  it('is orange from 50% up to and including 80%', () => {
    expect(statusForPct(0.5)).toBe('orange');
    expect(statusForPct(0.8)).toBe('orange');
  });

  it('is green above 80%', () => {
    expect(statusForPct(0.81)).toBe('green');
    expect(statusForPct(1)).toBe('green');
  });
});

describe('weeklyPct', () => {
  it('divides ticked days by goals-with-content * 7', () => {
    const goals = [
      { completedDays: [true, true, true, true, true, false, true] }, // 6/7
      { completedDays: [true, false, true, false, true, false, false] }, // 3/7
      { completedDays: [true, true, false, false, false, false, true] }, // 3/7
    ];
    // matches the spreadsheet example row: 12 ticks / 21 slots
    expect(weeklyPct(goals)).toBeCloseTo(12 / 21, 5);
  });

  it('returns 0 for a member with no goals', () => {
    expect(weeklyPct([])).toBe(0);
  });
});

describe('teamAveragePct', () => {
  it('averages member percentages', () => {
    expect(teamAveragePct([1, 0.5, 0])).toBeCloseTo(0.5, 5);
  });

  it('returns 0 for an empty group', () => {
    expect(teamAveragePct([])).toBe(0);
  });
});

describe('hundredDayPct', () => {
  it('divides weeks ticked by weeks elapsed, not total season length', () => {
    expect(hundredDayPct(3, 5)).toBeCloseTo(0.6, 5);
  });

  it('returns 0 before any weeks have elapsed', () => {
    expect(hundredDayPct(0, 0)).toBe(0);
  });
});

describe('currentStreak', () => {
  it('counts consecutive ticks walking back from the end', () => {
    expect(currentStreak([true, false, true, true, true])).toBe(3);
  });

  it('is 0 if the most recent day was missed', () => {
    expect(currentStreak([true, true, false])).toBe(0);
  });
});

describe('hasMissedToday', () => {
  it('is true only when every goal is unticked for the day', () => {
    const goals = [
      { completedDays: [false, false] },
      { completedDays: [false, true] },
    ];
    expect(hasMissedToday(goals, 0)).toBe(true);
    expect(hasMissedToday(goals, 1)).toBe(false);
  });

  it('is false for a member with no goals set yet', () => {
    expect(hasMissedToday([], 0)).toBe(false);
  });
});
