import { CanDeactivateFn } from '@angular/router';

// TODO Issue 39: confirmar salida si la partida está en curso
export const leaveGameGuard: CanDeactivateFn<unknown> = () => true;