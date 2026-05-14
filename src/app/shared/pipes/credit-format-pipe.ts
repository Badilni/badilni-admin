import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'creditFormat'
})
export class CreditFormatPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
