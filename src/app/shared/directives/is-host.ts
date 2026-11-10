import { Directive } from '@angular/core';
import { RoomRoleDirective } from './room-role.directive';

/** Solo el host de la sala: `<button *appIsHost>Expulsar</button>`, `<span *appIsHost>{{ option.text }}</span>` */
@Directive({ selector: '[appIsHost]' })
export class IsHost extends RoomRoleDirective {
  protected readonly role = 'host';
}
