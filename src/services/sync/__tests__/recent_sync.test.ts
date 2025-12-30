import { CalculateDaysToSyncFromLastDataDate } from '../recent_sync';

describe('recent_sync', () => {
  it('defaults to maxDays when lastDataDate is missing', () => {
    expect(CalculateDaysToSyncFromLastDataDate(undefined, 30, new Date('2024-01-10'))).toBe(
      30
    );
  });

  it('includes lastDataDate day (partial day safe)', () => {
    // Jan 10 - Jan 10 => 1 day
    expect(
      CalculateDaysToSyncFromLastDataDate(
        new Date('2024-01-10T23:59:00Z'),
        30,
        new Date('2024-01-10T00:01:00Z')
      )
    ).toBe(1);
  });

  it('caps at maxDays', () => {
    expect(
      CalculateDaysToSyncFromLastDataDate(
        new Date('2024-01-01T00:00:00Z'),
        30,
        new Date('2024-03-01T00:00:00Z')
      )
    ).toBe(30);
  });

  it('syncs from last data date to today inclusive', () => {
    // Jan 08 -> Jan 10 inclusive = 3
    expect(
      CalculateDaysToSyncFromLastDataDate(
        new Date('2024-01-08T12:00:00Z'),
        30,
        new Date('2024-01-10T12:00:00Z')
      )
    ).toBe(3);
  });
});


