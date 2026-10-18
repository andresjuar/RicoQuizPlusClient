import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: ToastType = 'info', title?: string, duration = 4000): void {
    const id = ++this.nextId;
    this._toasts.update(list => [...list, { id, type, message, title }]);
    if (duration > 0) setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, title?: string) { this.show(message, 'success', title); }
  error(message: string, title?: string)   { this.show(message, 'error', title, 6000); }
  warning(message: string, title?: string) { this.show(message, 'warning', title); }
  info(message: string, title?: string)    { this.show(message, 'info', title); }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}