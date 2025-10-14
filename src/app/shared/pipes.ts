import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'eurFromCents', standalone: true})
export class EurFromCentsPipe implements PipeTransform {
  transform(value?: number): string {
    const c = value ?? 0;
    return new Intl.NumberFormat(undefined, { style:'currency', currency:'EUR' }).format(c/100);
  }
}
