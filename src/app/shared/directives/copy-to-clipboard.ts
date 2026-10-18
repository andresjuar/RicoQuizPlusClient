import { Directive, input, output } from '@angular/core';

/** Copia `appCopyToClipboard` al portapapeles al hacer clic. Emite `copied` con true/false. */
@Directive({
  selector: '[appCopyToClipboard]',
  host: { '(click)': 'copy()' },
})
export class CopyToClipboard {
  readonly appCopyToClipboard = input.required<string>();
  readonly copied = output<boolean>();

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.appCopyToClipboard());
      this.copied.emit(true);
    } catch {
      this.copied.emit(false);
    }
  }
}