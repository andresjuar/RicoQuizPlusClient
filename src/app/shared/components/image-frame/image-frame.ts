import { Component, computed, input, linkedSignal, output } from '@angular/core';

type State = 'loading' | 'loaded' | 'error';

/**
 * <img> con estados de carga y error para las imágenes subidas (portadas e imágenes de preguntas).
 * - Cargando: esqueleto animado.
 * - Error (URL rota, archivo borrado en Cloudinary, sin red): aviso en vez de un hueco vacío,
 *   con "Reintentar" opcional (no usarlo dentro de otro botón).
 * El estado "vacío" (sin imagen) lo decide quien lo usa, porque cambia según la vista.
 */
@Component({
  selector: 'app-image-frame',
  template: `
    @if (state() === 'loading') {
      <span class="frame__skeleton" aria-hidden="true"></span>
    }
    @if (state() === 'error') {
      <span class="frame__error" role="img" [attr.aria-label]="'No se pudo cargar: ' + alt()">
        <span aria-hidden="true">⚠️</span>
        <small>No se pudo cargar la imagen</small>
        @if (retryable()) {
          <button type="button" class="btn btn--ghost frame__retry" (click)="retry()">Reintentar</button>
        }
      </span>
    } @else {
      <img [src]="currentSrc()" [alt]="alt()" [attr.loading]="lazy() ? 'lazy' : null"
           [class.is-hidden]="state() !== 'loaded'" [style.object-fit]="fit()"
           (load)="state.set('loaded')" (error)="onError()" />
    }
  `,
  styles: `
    :host { position: relative; display: block; width: 100%; height: 100%; overflow: hidden; }
    img { display: block; width: 100%; height: 100%; }
    img.is-hidden { visibility: hidden; }
    .frame__skeleton {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, var(--surface) 25%, var(--surface-strong) 50%, var(--surface) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.2s infinite;
    }
    .frame__error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--sp-1);
      width: 100%;
      height: 100%;
      min-height: 72px;
      padding: var(--sp-2);
      text-align: center;
      color: var(--text-muted);
      background: var(--surface);
    }
    .frame__error small { font-size: var(--fs-xs); }
    .frame__retry { margin-top: var(--sp-1); padding: var(--sp-1) var(--sp-3); font-size: var(--fs-xs); }
    @media (prefers-reduced-motion: reduce) { .frame__skeleton { animation: none; } }
  `,
})
export class ImageFrame {
  readonly src = input.required<string>();
  readonly alt = input('');
  readonly fit = input<'cover' | 'contain'>('cover');
  readonly lazy = input(true);
  /** Muestra "Reintentar" en el estado de error */
  readonly retryable = input(false);

  /** Avisa al contenedor si la imagen no cargó (p. ej. para ocultar "Descargar") */
  readonly failed = output<void>();

  // Si cambia la imagen, vuelve a "cargando" y se reinician los reintentos
  protected readonly state = linkedSignal<string, State>({ source: this.src, computation: () => 'loading' });
  private readonly attempt = linkedSignal({ source: this.src, computation: () => 0 });

  // Al reintentar se agrega ?retry=N para que el navegador vuelva a pedir la imagen
  protected readonly currentSrc = computed(() => {
    const n = this.attempt();
    if (!n) return this.src();
    return `${this.src()}${this.src().includes('?') ? '&' : '?'}retry=${n}`;
  });

  protected onError(): void {
    this.state.set('error');
    this.failed.emit();
  }

  protected retry(): void {
    this.attempt.update(n => n + 1);
    this.state.set('loading');
  }
}
