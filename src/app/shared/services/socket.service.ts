import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import {
  ClientEvent,
  ClientPayload,
  ClientToServerEvents,
  ConnectionStatus,
  ServerEvent,
  ServerPayload,
  ServerToClientEvents,
} from '../models/socket-events.model';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Única conexión de Socket.IO de toda la app (namespace `/matches`).
 *
 * - Es `providedIn: 'root'` y crea UN solo socket; los componentes nunca llaman a `io()`.
 * - Se abre al iniciar sesión y se cierra al cerrar sesión (effect sobre AuthService.user()).
 *   Los invitados no tienen sesión: GameRoom la abre con `ensureConnected()` al entrar a una sala.
 * - El JWT se manda en `handshake.auth.token`, como pide el backend. Se lee en cada intento
 *   de conexión, así una reconexión siempre usa el token vigente.
 * - Socket.IO reconecta solo; aquí solo se traduce su ciclo de vida a `status()`.
 * - `on()` regresa un Observable que quita su listener al desuscribirse, para que las vistas
 *   lo limpien con takeUntilDestroyed y no se dupliquen eventos al navegar.
 */
@Injectable({ providedIn: 'root' })
export class SocketService {
  private readonly auth = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly socket: GameSocket = io(`${environment.socketUrl}${environment.socketNamespace}`, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    // Función: se evalúa en cada (re)conexión
    auth: cb => {
      const token = this.tokenStorage.get();
      cb(token ? { token } : {});
    },
  });

  private readonly _status = signal<ConnectionStatus>('disconnected');
  readonly status = this._status.asReadonly();
  readonly isConnected = computed(() => this._status() === 'connected');

  private readonly _connected = new Subject<void>();
  /** Emite en cada conexión exitosa, incluidas las reconexiones (sirve para resincronizar la vista) */
  readonly connected$ = this._connected.asObservable();

  private readonly _connectError = new Subject<string>();
  /** Errores del handshake (p. ej. token inválido o servidor caído) */
  readonly connectError$ = this._connectError.asObservable();

  /** Usuario con el que se abrió la conexión actual; si cambia, se reconecta con el nuevo token */
  private connectedAs: string | null = null;

  constructor() {
    this.bindLifecycle();

    // Conexión ligada a la sesión: login -> conecta, logout -> desconecta
    effect(() => {
      const userId = this.auth.user()?._id ?? null;
      untracked(() => {
        if (userId && userId !== this.connectedAs) {
          this.connectedAs = userId;
          this.restart();
        } else if (!userId && this.connectedAs) {
          this.connectedAs = null;
          this.disconnect();
        }
      });
    });
  }

  /** Abre la conexión si no está abierta (la usan invitados al entrar a /play/:code) */
  ensureConnected(): void {
    if (this.socket.connected || this.socket.active) return;
    this._status.set('connecting');
    this.socket.connect();
  }

  disconnect(): void {
    this.socket.disconnect();
    this._status.set('disconnected');
  }

  /** Socket.id actual (cambia en cada reconexión) */
  get id(): string | null {
    return this.socket.id ?? null;
  }

  /** Escucha un evento del servidor; el listener se quita al desuscribirse */
  on<E extends ServerEvent>(event: E): Observable<ServerPayload<E>> {
    return new Observable<ServerPayload<E>>(subscriber => {
      const handler = (payload: ServerPayload<E>) => subscriber.next(payload);
      // Socket.IO no infiere bien el tipo del listener con un evento genérico
      const s = this.socket as unknown as Socket;
      s.on(event as string, handler);
      return () => s.off(event as string, handler);
    });
  }

  /**
   * Emite un evento al servidor. Regresa false (sin emitir) si no hay conexión,
   * para que la vista muestre un aviso en vez de fallar en silencio.
   */
  emit<E extends ClientEvent>(event: E, ...args: ClientPayload<E>): boolean {
    if (!this.socket.connected) return false;
    (this.socket as unknown as Socket).emit(event as string, ...args);
    return true;
  }

  private restart(): void {
    this.socket.disconnect();
    this._status.set('connecting');
    this.socket.connect();
  }

  private bindLifecycle(): void {
    this.socket.on('connect', () => {
      this._status.set('connected');
      this._connected.next();
    });

    this.socket.on('disconnect', reason => {
      if (reason === 'io client disconnect') {
        this._status.set('disconnected');
      } else if (reason === 'io server disconnect') {
        // El servidor cortó: Socket.IO no reintenta solo en este caso
        this._status.set('reconnecting');
        this.socket.connect();
      } else {
        this._status.set('reconnecting');
      }
    });

    this.socket.on('connect_error', err => {
      // `active` = Socket.IO seguirá reintentando; si no, el servidor rechazó el handshake
      this._status.set(this.socket.active ? 'reconnecting' : 'disconnected');
      if (!this.socket.active) this._connectError.next(err.message);
    });
  }
}
