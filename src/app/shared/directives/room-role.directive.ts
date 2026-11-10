import { Directive, TemplateRef, ViewContainerRef, effect, inject, untracked } from '@angular/core';
import { PlayerRole } from '../models/game.model';
import { RoomSession } from '../services/room-session.service';

/**
 * Base de *appIsHost y *appIsPlayer: muestra el bloque si el rol de la sala coincide.
 *
 * Lee RoomSession, que se provee en GameShell; fuera de una sala, o antes de que el servidor
 * asigne rol, no muestra nada. Ocultar algo no basta: el servidor valida cada acción y no
 * debe mandar a los jugadores datos que no deban ver (p. ej. la respuesta correcta).
 */
@Directive()
export abstract class RoomRoleDirective {
  protected abstract readonly role: PlayerRole;

  private readonly room = inject(RoomSession, { optional: true });
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private hasView = false;

  constructor() {
    effect(() => {
      const allowed = this.room?.role() === this.role;

      untracked(() => {
        if (allowed && !this.hasView) {
          this.viewContainer.createEmbeddedView(this.template);
          this.hasView = true;
        } else if (!allowed && this.hasView) {
          this.viewContainer.clear();
          this.hasView = false;
        }
      });
    });
  }
}
