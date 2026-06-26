import { TimeAgoPipe } from './time-ago-pipe';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;

  beforeEach(() => {
    pipe = new TimeAgoPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "—" for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('should return "—" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('should return "—" for an invalid date string', () => {
    expect(pipe.transform('not-a-date')).toBe('—');
  });

  it('should return "just now" for the current time', () => {
    expect(pipe.transform(new Date())).toBe('just now');
  });

  it('should return "just now" for a time less than 60 seconds ago', () => {
    const date = new Date(Date.now() - 30 * 1000);
    expect(pipe.transform(date)).toBe('just now');
  });

  it('should return minutes ago for a time within the last hour', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(pipe.transform(date)).toBe('5 minutes ago');
  });

  it('should use singular form for 1 minute', () => {
    const date = new Date(Date.now() - 60 * 1000);
    expect(pipe.transform(date)).toBe('1 minute ago');
  });

  it('should return hours ago for a time within the last day', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(pipe.transform(date)).toBe('3 hours ago');
  });

  it('should return days ago for a time within the last month', () => {
    const date = new Date(Date.now() - 2 * 86400 * 1000);
    expect(pipe.transform(date)).toBe('2 days ago');
  });

  it('should accept ISO date strings as input', () => {
    const isoString = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(pipe.transform(isoString)).toBe('1 hour ago');
  });
});
