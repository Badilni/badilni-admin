import { CreditFormatPipe } from './credit-format-pipe';

describe('CreditFormatPipe', () => {
  let pipe: CreditFormatPipe;

  beforeEach(() => {
    pipe = new CreditFormatPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format a positive number without sign by default', () => {
    expect(pipe.transform(1250)).toBe('1,250 TC');
  });

  it('should format a negative number with minus sign', () => {
    expect(pipe.transform(-150)).toBe('-150 TC');
  });

  it('should add plus sign when showSign is true and value is positive', () => {
    expect(pipe.transform(200, true)).toBe('+200 TC');
  });

  it('should add minus sign when showSign is true and value is negative', () => {
    expect(pipe.transform(-200, true)).toBe('-200 TC');
  });

  it('should not add sign for zero even when showSign is true', () => {
    expect(pipe.transform(0, true)).toBe('0 TC');
  });

  it('should return "0 TC" for null', () => {
    expect(pipe.transform(null)).toBe('0 TC');
  });

  it('should return "0 TC" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('0 TC');
  });

  it('should return "0 TC" for NaN', () => {
    expect(pipe.transform(NaN)).toBe('0 TC');
  });

  it('should format large numbers with thousands separators', () => {
    expect(pipe.transform(45231)).toBe('45,231 TC');
  });
});
