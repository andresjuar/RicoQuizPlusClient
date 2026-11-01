import { Component, Resource, computed, effect, input, signal } from '@angular/core';

export type ViewStatus = 'loading' | 'error' | 'empty' | 'ready';

/** Si la carga pasa de esto, se avisa que el servidor puede estar despertando (Render free) */
const SLOW_MS = 5000;

/** Lo único que este componente necesita de un resource: leer su estado y poder recargarlo */
type ReloadableResource = Resource<unknown> & { reload(): boolean };

/** Vacío por defecto: arreglo sin elementos o Page<T> con data vacío */
function defaultIsEmpty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === 'object' && 'data' in value && Array.isArray(value.data)) {
    return value.data.length === 0;
  }
  return value === null || value === undefined;
}

/**
 * Pinta los estados de una vista que consume la API: carga, error (con reintentar) y vacío.
 * El contenido "ready" lo pinta la página, preguntando a este componente:
 *
 *   <app-view-state #vs [resource]="quizzes" emptyTitle="..." />
 *   @if (vs.isReady()) { ...lista con quizzes.value()... }
 *
 * Ojo: resource.value() LANZA si el resource está en error; por eso la página solo lo lee
 * dentro de @if (vs.isReady()) y este componente decide qué es "vacío".
 */
@Component({
  selector: 'app-view-state',
  templateUrl: './view-state.html',
  styleUrl: './view-state.scss',
})
export class ViewState {
  /** Un rxResource / resource / httpResource de la página */
  readonly resource = input.required<ReloadableResource>();
  /** Cuándo el valor cuenta como vacío. null = nunca (la página pinta su propio vacío) */
  readonly emptyWhen = input<((value: never) => boolean) | null>(defaultIsEmpty);

  readonly emptyIcon = input('📭');
  readonly emptyTitle = input('No hay nada por aquí');
  readonly emptyText = input('');
  readonly errorTitle = input('No se pudo cargar');

  readonly status = computed<ViewStatus>(() => {
    const res = this.resource();
    if (res.error()) return 'error';
    if (!res.hasValue()) return 'loading';
    const emptyWhen = this.emptyWhen() as ((value: unknown) => boolean) | null;
    return emptyWhen?.(res.value()) ? 'empty' : 'ready';
  });

  readonly isReady = computed(() => this.status() === 'ready');

  /** El ApiError del interceptor ya trae el mensaje para el usuario */
  protected readonly errorMessage = computed(() => {
    const err = this.resource().error();
    return err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
  });

  protected readonly slow = signal(false);

  constructor() {
    // Cada vez que entra a "loading" arranca un contador; si sale antes, se cancela
    effect(onCleanup => {
      this.slow.set(false);
      if (this.status() !== 'loading') return;
      const timer = setTimeout(() => this.slow.set(true), SLOW_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected retry(): void {
    this.resource().reload();
  }
}
