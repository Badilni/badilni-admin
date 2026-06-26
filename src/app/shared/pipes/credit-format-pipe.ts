import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'creditFormat',
})
export class CreditFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, showSign: boolean = false): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0 TC';
    }

    const formatted = Math.abs(value).toLocaleString();
    const sign = showSign && value > 0 ? '+' : value < 0 ? '-' : '';

    return `${sign}${formatted} TC`;
  }
}
