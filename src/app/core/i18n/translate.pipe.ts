import { Pipe, PipeTransform, inject } from '@angular/core';
import { UiStore } from '../stores/ui.store';

@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly ui = inject(UiStore);

  transform(key: string): string {
    return this.ui.t(key);
  }
}
