import { Component, effect, input, signal } from '@angular/core';
import { toDataURL } from 'qrcode';

/**
 * QR para entrar a la sala desde el celular: codifica el link `/play/<CÓDIGO>`, que abre
 * directo la pantalla de nombre de invitado (o el lobby, si ya tiene sesión).
 * Se genera en el navegador (librería `qrcode`), sin mandar el link a ningún servicio externo.
 */
@Component({
  selector: 'app-room-qr',
  template: `
    <figure class="qr">
      @if (dataUrl(); as src) {
        <img class="qr__img" [src]="src" width="148" height="148" [alt]="'Código QR para unirse a la sala: ' + url()" />
      } @else if (failed()) {
        <span class="qr__state" role="status">No se pudo generar el QR. Usa el código de sala.</span>
      } @else {
        <span class="qr__img qr__img--loading" aria-hidden="true"></span>
      }
      <figcaption>Escanea para unirte</figcaption>
    </figure>
  `,
  styles: `
    .qr {
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--sp-2);
      padding: var(--sp-3);
      flex-shrink: 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
    }
    /* Fondo blanco siempre: los lectores de QR necesitan buen contraste */
    .qr__img {
      display: block;
      width: 148px;
      height: 148px;
      padding: 6px;
      border-radius: var(--radius-md);
      background: #fff;
    }
    .qr__img--loading { opacity: 0.4; }
    .qr__state { max-width: 148px; font-size: var(--fs-xs); color: var(--text-muted); text-align: center; }
    figcaption { font-size: var(--fs-xs); color: var(--text-muted); }
  `,
})
export class RoomQr {
  /** Link completo para unirse (lo arma el lobby con el origen actual y el código) */
  readonly url = input.required<string>();

  protected readonly dataUrl = signal<string | null>(null);
  protected readonly failed = signal(false);

  constructor() {
    effect(onCleanup => {
      const url = this.url();
      let stale = false;
      onCleanup(() => (stale = true));

      this.dataUrl.set(null);
      this.failed.set(false);
      toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 296, color: { dark: '#1b1035', light: '#ffffff' } })
        .then(src => !stale && this.dataUrl.set(src))
        .catch(() => !stale && this.failed.set(true));
    });
  }
}
