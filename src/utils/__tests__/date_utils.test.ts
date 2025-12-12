import {
  FormatDate,
  GetStartOfDay,
  GetEndOfDay,
  GetDateRange,
  GetDateArray,
} from '../date_utils';

describe('date_utils', () => {
  describe('GetStartOfDay', () => {
    it('should return start of day', () => {
      const date = new Date('2024-01-15T15:30:00');
      const start = GetStartOfDay(date);

      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
    });
  });

  describe('GetEndOfDay', () => {
    it('should return end of day', () => {
      const date = new Date('2024-01-15T15:30:00');
      const end = GetEndOfDay(date);

      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });
  });

  describe('GetDateRange', () => {
    it('should return correct date range for given days', () => {
      const { start, end } = GetDateRange(7);

      const diffInDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      // start is start-of-day (days-1 back) and end is end-of-day (today),
      // so for 7 days we expect a ~7 day span.
      expect(diffInDays).toBe(7);
    });
  });

  describe('GetDateArray', () => {
    it('should return array of dates between start and end', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-05');

      const dates = GetDateArray(start, end);

      expect(dates).toHaveLength(5);
      expect(dates[0].getDate()).toBe(1);
      expect(dates[4].getDate()).toBe(5);
    });

    it('should handle single day range', () => {
      const date = new Date('2024-01-01');
      const dates = GetDateArray(date, date);

      expect(dates).toHaveLength(1);
    });
  });

  describe('FormatDate', () => {
    it('should format date', () => {
      const date = new Date('2024-01-15');
      const formatted = FormatDate(date);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });
});
