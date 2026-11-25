import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { UploadEvent } from '../../models/upload.model';
import { MAX_IMAGE_MB, validateImageFile } from '../../validators/image-file.validator';

type Status = 'idle' | 'selected' | 'uploading' | 'processing' | 'error';

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.html',
  styleUrl: './file-uploader.scss',
})
export class FileUploader {
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUrl = input<string | null>(null);
  readonly upload = input.required<(file: File) => Observable<UploadEvent>>();
  readonly disabled = input(false);

  readonly uploaded = output<string>();

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
    if (!file) return;

    this.error.set(null);
    this.progress.set(0);
    this.status.set('uploading');

    this.subscription = this.upload()(file).subscribe({
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