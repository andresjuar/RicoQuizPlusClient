import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmService } from '../services/confirm.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = component =>
  !component.hasUnsavedChanges() ||
  inject(ConfirmService).confirm({
    title: '¿Salir sin guardar?',
    message: 'Tienes cambios sin guardar. Si sales ahora, se perderán.',
    confirmText: 'Salir sin guardar',
    cancelText: 'Seguir editando',
    variant: 'danger',
  });