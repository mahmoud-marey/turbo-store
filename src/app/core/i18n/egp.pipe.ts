import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'egp' })
export class EgpPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return 'EGP —';
    return `EGP${value.toLocaleString('en-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}
