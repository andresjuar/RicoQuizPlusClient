import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { downloadUrl } from '../../utils/download-url';
import { ImageFrame } from '../image-frame/image-frame';

export interface ImageViewerData {
  url: string;
  title: string;
  canDelete: boolean;
}

export type ImageViewerResult = 'delete' | undefined;

@Component({
  imports: [ImageFrame],
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.html',
  styleUrl: './image-viewer.scss',
})
export class ImageViewer {
  protected readonly data = inject<ImageViewerData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<ImageViewerResult>>(DialogRef);
  protected readonly download = downloadUrl(this.data.url);
  /** Si la imagen no cargó, no tiene caso ofrecer descargarla */
  protected readonly failed = signal(false);
}