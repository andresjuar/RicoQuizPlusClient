import { Injectable, computed, signal } from '@angular/core';
import { PlayerRole } from '../models/game.model';

/**
 * Rol de runtime dentro de una sala (host/player). No es un rol de la app (eso es AuthService.role()).
 *
 * NO es providedIn: 'root': se provee en GameShell (`providers: [RoomSession]`), así existe solo
 * mientras estás en /play/:code y se destruye al salir. El rol lo asigna el servidor al unirse
 * (evento de socket); el cliente nunca lo elige.
 */
@Injectable()
export class RoomSession {
  private readonly _role = signal<PlayerRole | null>(null);

  /** null = todavía no se une a la sala */
  readonly role = this._role.asReadonly();
  readonly isHost = computed(() => this._role() === 'host');

  /** Lo llama la capa de sockets cuando el servidor confirma la entrada (o transfiere el host) */
  setRole(role: PlayerRole): void {
    this._role.set(role);
  }

  clear(): void {
    this._role.set(null);
  }
}
