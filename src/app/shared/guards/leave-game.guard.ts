import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../services/confirm.service';

/** Lo que el guard necesita saber de la pantalla de partida (la implementa GameShell). */
export interface GameLeaveState {
  /** true si salir ahora abandonaría una partida en curso */
  shouldConfirmLeave(): boolean;
}

/** Pide confirmación antes de salir de /play/:code mientras la partida está en curso. */
export const leaveGameGuard: CanDeactivateFn<GameLeaveState> = component => {
  if (!component.shouldConfirmLeave()) return true;

  return inject(ConfirmService).confirm({
    title: '¿Salir de la partida?',
    message: 'La partida está en curso. Si sales ahora, abandonarás la sala.',
    confirmText: 'Salir',
    cancelText: 'Quedarme',
    variant: 'danger',
  });
};