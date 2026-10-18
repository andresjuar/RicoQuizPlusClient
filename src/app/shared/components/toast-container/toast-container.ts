import { Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {
  protected readonly toast = inject(ToastService);
  protected readonly icons: Record<ToastType, string> = {
    success: '✓', error: '✕', warning: '!', info: 'i',
  };
}