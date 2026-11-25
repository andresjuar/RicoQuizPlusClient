import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { UploadEvent } from '../../models/upload.model';
import { MAX_IMAGE_MB, validateImageFile } from '../../validators/image-file.validator';

type Status = 'idle' | 'selected' | 'uploading' | 'processing' | 'error';

/**
 * Selector de imagen con clic o arrastrar y soltar, validación de tipo y tamaño y vista previa.
 *
 * Dos modos:
 * - `upload` (default): sube en cuanto el usuario pulsa "Subir imagen", con barra de progreso y
 *   cancelar. Necesita `upload` (la función del servicio). Lo usa la portada al editar un quiz.
 * - `pick`: solo valida y emite `picked(file)`; quien lo usa guarda el archivo y lo sube después
 *   (p. ej. al guardar el quiz, cuando ya existe y tiene id). Lo usan las preguntas y la portada al crear.
 */
@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.html',
  styleUrl: './file-uploader.scss',
  host: {
    // Si sueltas la imagen fuera del recuadro, el navegador la abriría y saldrías de la app
    '(window:dragover)': 'blockOutsideDrop($event)',
    '(window:drop)': 'blockOutsideDrop($event)',
  },
})
export class FileUploader {
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUrl = input<string | null>(null);
  readonly mode = input<'upload' | 'pick'>('upload');
  /** Solo en modo `upload` */
  readonly upload = input<((file: File) => Observable<UploadEvent>) | null>(null);
  readonly disabled = input(false);
  /** Recuadro más bajo, para usarlo dentro de cada pregunta */
  readonly compact = input(false);

  /** Modo `upload`: URL final que regresó la API */
  readonly uploaded = output<string>();
  /** Modo `pick`: archivo ya validado */
  readonly picked = output<File>();

  protected readonly status = signal<Status>('idle');
  protected readonly file = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly progress = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly dragging = signal(false);
  protected readonly maxMb = MAX_IMAGE_MB;

  private subscription?: Subscription;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.subscription?.unsubscribe();
      this.revokePreview();
    });
  }

  protected openSelector(input: HTMLInputElement): void {
    if (this.disabled() || this.busy()) return;
    input.click();
  }

  protected onInputChange(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (file) this.select(file);
    input.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.disabled() || this.busy()) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.select(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled() && !this.busy()) this.dragging.set(true);
  }

  protected blockOutsideDrop(event: DragEvent): void {
    if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
  }

  protected busy(): boolean {
    return this.status() === 'uploading' || this.status() === 'processing';
  }

  private select(file: File): void {
    const problem = validateImageFile(file);
    if (problem) {
      this.error.set(problem);
      this.status.set(this.file() ? 'selected' : 'error');
      return;
    }

    if (this.mode() === 'pick') {
      this.error.set(null);
      this.status.set('idle');
      this.picked.emit(file);
      return;
    }

    this.revokePreview();
    this.file.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
    this.error.set(null);
    this.progress.set(0);
    this.status.set('selected');
  }

  protected clear(): void {
    this.revokePreview();
    this.file.set(null);
    this.error.set(null);
    this.progress.set(0);
    this.status.set('idle');
  }

  protected send(): void {
    const file = this.file();
    const upload = this.upload();
    if (!file || !upload) return;

    this.error.set(null);
    this.progress.set(0);
    this.status.set('uploading');

    this.subscription = upload(file).subscribe({
      next: event => {
        this.progress.set(event.progress);
        if (event.url) {
          this.uploaded.emit(event.url);
          this.clear();
        } else if (event.progress >= 100) {
          this.status.set('processing'); // el archivo ya llegó; la API lo está guardando
        }
      },
      error: err => {
        this.error.set(err?.message ?? 'No se pudo subir la imagen.');
        this.status.set('selected'); // conserva el archivo para reintentar
      },
    });
  }

  protected cancel(): void {
    this.subscription?.unsubscribe();
    this.progress.set(0);
    this.status.set('selected');
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
  }
}
