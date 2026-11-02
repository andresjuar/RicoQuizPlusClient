import { Component, ElementRef, afterNextRender, inject, input, output, signal, viewChild } from '@angular/core';
import { GoogleButtonText, GoogleIdentityService } from '../../services/google-identity.service';

/**
 * Botón oficial de "Continuar con Google". Emite el credential cuando el usuario
 * elige su cuenta; la página decide qué hacer con él (login o registro).
 */
@Component({
  selector: 'app-google-button',
  templateUrl: './google-button.html',
  styleUrl: './google-button.scss',
})
export class GoogleButton {
  private readonly google = inject(GoogleIdentityService);

  readonly text = input<GoogleButtonText>('continue_with');
  readonly credential = output<string>();

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  protected readonly enabled = this.google.enabled;
  protected readonly failed = signal(false);

  constructor() {
    // El botón se dibuja dentro de un div ya renderizado (Google necesita medir su ancho)
    afterNextRender(() => {
      if (!this.enabled) return;
      this.google
        .renderButton(this.host().nativeElement, this.text(), credential => this.credential.emit(credential))
        .catch(() => this.failed.set(true));
    });
  }
}
