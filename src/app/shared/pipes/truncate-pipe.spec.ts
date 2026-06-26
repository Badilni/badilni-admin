import { TruncatePipe } from './truncate-pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return the original string if shorter than the limit', () => {
    expect(pipe.transform('Short text', 50)).toBe('Short text');
  });

  it('should return the original string if equal to the limit', () => {
    expect(pipe.transform('12345', 5)).toBe('12345');
  });

  it('should truncate and add default suffix when longer than the limit', () => {
    expect(pipe.transform('This is a long sentence', 10)).toBe('This is a...');
  });

  it('should use a custom suffix when provided', () => {
    expect(pipe.transform('This is a long sentence', 10, '…')).toBe('This is a…');
  });

  it('should use a default limit of 50 when not provided', () => {
    const longText = 'a'.repeat(60);
    const result = pipe.transform(longText);
    expect(result.length).toBe(53); // 50 chars + '...'
  });

  it('should trim trailing whitespace before adding suffix', () => {
    expect(pipe.transform('Hello   world', 7)).toBe('Hello...');
  });
});
