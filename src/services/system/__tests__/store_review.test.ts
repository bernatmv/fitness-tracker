import {
  ShouldAskForReview,
  RecordActiveDay,
  MILESTONE_DAYS,
  MIN_DAYS_BETWEEN_ASKS,
  type ReviewState,
} from '../store_review';

const at = (iso: string) => new Date(`${iso}T12:00:00Z`);
const state = (over: Partial<ReviewState> = {}): ReviewState => ({
  activeDays: [],
  askCount: 0,
  ...over,
});

describe('RecordActiveDay', () => {
  it('records a day once however many times the app is opened', () => {
    let s = state();
    s = RecordActiveDay(s, at('2026-09-01'));
    s = RecordActiveDay(s, at('2026-09-01'));
    expect(s.activeDays).toEqual(['2026-09-01']);
  });

  it('accumulates distinct days', () => {
    let s = state();
    for (const d of ['2026-09-01', '2026-09-02', '2026-09-03']) s = RecordActiveDay(s, at(d));
    expect(s.activeDays).toHaveLength(3);
  });

  it('never grows without bound', () => {
    let s = state();
    for (let i = 1; i <= 40; i++) {
      s = RecordActiveDay(s, at(`2026-09-${String(i % 28 || 1).padStart(2, '0')}`));
    }
    expect(s.activeDays.length).toBeLessThanOrEqual(MILESTONE_DAYS);
  });

  it('returns the same object when the day is already recorded', () => {
    const s = RecordActiveDay(state(), at('2026-09-01'));
    expect(RecordActiveDay(s, at('2026-09-01'))).toBe(s);
  });
});

describe('ShouldAskForReview', () => {
  const reached = state({ activeDays: ['2026-09-01', '2026-09-02', '2026-09-03'] });

  it('does not ask on a first visit', () => {
    expect(ShouldAskForReview(state({ activeDays: ['2026-09-01'] }), at('2026-09-01'))).toBe(false);
  });

  it('does not ask before the milestone', () => {
    expect(
      ShouldAskForReview(state({ activeDays: ['2026-09-01', '2026-09-02'] }), at('2026-09-02')),
    ).toBe(false);
  });

  it('asks once the user has come back on enough separate days', () => {
    expect(ShouldAskForReview(reached, at('2026-09-03'))).toBe(true);
  });

  it('does not ask twice inside Apple\'s window', () => {
    const asked = { ...reached, lastAskedAt: '2026-09-03', askCount: 1 };
    expect(ShouldAskForReview(asked, at('2026-09-04'))).toBe(false);
    expect(ShouldAskForReview(asked, at(`2026-12-01`))).toBe(false);
  });

  it('may ask again well after the window', () => {
    const asked = { ...reached, lastAskedAt: '2026-01-01', askCount: 1 };
    expect(MIN_DAYS_BETWEEN_ASKS).toBeGreaterThan(90);
    expect(ShouldAskForReview(asked, at('2026-09-03'))).toBe(true);
  });

  it('stops after three asks — iOS drops the rest, and the user has answered', () => {
    const spent = { ...reached, lastAskedAt: '2025-01-01', askCount: 3 };
    expect(ShouldAskForReview(spent, at('2026-09-03'))).toBe(false);
  });
});
