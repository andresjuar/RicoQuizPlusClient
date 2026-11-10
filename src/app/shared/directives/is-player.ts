import { Directive } from '@angular/core';
import { RoomRoleDirective } from './room-role.directive';

/** Solo jugadores (no host): `<p *appIsPlayer>Mira la pantalla del host</p>` */
@Directive({ selector: '[appIsPlayer]' })
export class IsPlayer extends RoomRoleDirective {
  protected readonly role = 'player';
}
