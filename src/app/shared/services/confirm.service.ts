import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmDialog, ConfirmData } from '../components/confirm-dialog/confirm-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(Dialog);

  /** Emite true solo si el usuario confirma. Escape o clic fuera devuelven false. */
  confirm(data: ConfirmData): Observable<boolean> {
    const ref = this.dialog.open<boolean, ConfirmData>(ConfirmDialog, {
      data,
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      backdropClass: 'rq-backdrop',
    });
    return ref.closed.pipe(map(result => result === true));
  }
}