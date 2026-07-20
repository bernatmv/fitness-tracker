import {
  FormatDate,
  GetDateFnsLocale,
  GetStartOfDay,
  GetEndOfDay,
  GetDateRange,
  GetDateArray,
  GetDateYearsAgo,
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

  describe('GetDateYearsAgo', () => {
    it('should return the same calendar date N years earlier', () => {
      const from = new Date('2026-07-21T10:00:00');
      const result = GetDateYearsAgo(5, from);

      expect(result.getFullYear()).toBe(2021);
      expect(result.getMonth()).toBe(from.getMonth());
      expect(result.getDate()).toBe(from.getDate());
    });

    it('should not mutate the input date', () => {
      const from = new Date('2026-07-21T10:00:00');
      GetDateYearsAgo(10, from);

      expect(from.getFullYear()).toBe(2026);
    });

    it('should default to now when no reference date is given', () => {
      const result = GetDateYearsAgo(2);

      expect(result.getFullYear()).toBe(new Date().getFullYear() - 2);
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

    it('should format using the device locale (en by default in tests)', () => {
      const date = new Date('2024-01-15T12:00:00');
      const formatted = FormatDate(date);

      expect(formatted).toBe('Jan 15, 2024');
    });
  });

  describe('GetDateFnsLocale', () => {
    it('should return the Spanish locale for "es"', () => {
      expect(GetDateFnsLocale('es').code).toBe('es');
    });

    it('should return the English locale for "en"', () => {
      expect(GetDateFnsLocale('en').code).toBe('en-US');
    });

    it('should fall back to English for unsupported languages', () => {
      expect(GetDateFnsLocale('fr').code).toBe('en-US');
    });

    it('should default to the device locale when no code is given', () => {
      // jest.setup mocks react-native-localize to en-US
      expect(GetDateFnsLocale().code).toBe('en-US');
    });
  });
});
