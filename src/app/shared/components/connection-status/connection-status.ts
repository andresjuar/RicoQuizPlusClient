import { Component, computed, inject } from '@angular/core';
import { ConnectionStatus as Status } from '../../models/socket-events.model';
import { SocketService } from '../../services/socket.service';

type Tone = 'ok' | 'warn' | 'error';

const VIEW: Record<Status, { label: string; tone: Tone }> = {
  connected: { label: 'Conectado', tone: 'ok' },
  connecting: { label: 'Conectando…', tone: 'warn' },
  reconnecting: { label: 'Reconectando…', tone: 'warn' },
  disconnected: { label: 'Sin conexión', tone: 'error' },
};

/**
 * Indicador del estado de la conexión en tiempo real (verde, amarillo o rojo).
 * Lee SocketService.status(), así que cambia solo al conectar, perder la conexión o reconectar.
 */
@Component({
  selector: 'app-connection-status',
  template: `
    <span class="cs" [attr.data-tone]="view().tone" role="status" aria-live="polite"
          [attr.title]="'Tiempo real: ' + view().label">
      <span class="cs__dot" aria-hidden="true"></span>
      <span class="cs__label">{{ view().label }}</span>
    </span>
  `,
  styles: `
    .cs {
      --tone: var(--success);
      display: inline-flex;
      align-items: center;
      gap: var(--sp-2);
      padding: 2px var(--sp-3);
      border-radius: var(--radius-full);
      font-size: var(--fs-xs);
      font-weight: 600;
      white-space: nowrap;
      color: var(--tone);
      background: color-mix(in srgb, var(--tone) 14%, transparent);
    }
    .cs[data-tone='warn'] { --tone: var(--warning); }
    .cs[data-tone='error'] { --tone: var(--danger); }
    .cs__dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .cs[data-tone='warn'] .cs__dot { animation: cs-pulse 1s ease-in-out infinite; }
    @keyframes cs-pulse { 50% { opacity: 0.35; } }
    @media (prefers-reduced-motion: reduce) { .cs__dot { animation: none !important; } }
    /* En móvil solo el punto; el texto sigue disponible para lectores de pantalla y en el title */
    @media (max-width: 640px) {
      .cs { padding: 6px; }
      .cs__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    }
  `,
})
export class ConnectionStatus {
  private readonly socket = inject(SocketService);
  protected readonly view = computed(() => VIEW[this.socket.status()]);
}
