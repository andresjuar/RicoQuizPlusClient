import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { downloadUrl } from '../../utils/download-url';

export interface ImageViewerData {
  url: string;
  title: string;
  canDelete: boolean;
}

export type ImageViewerResult = 'delete' | undefined;

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.html',
  styleUrl: './image-viewer.scss',
})
export class ImageViewer {
  protected readonly data = inject<ImageViewerData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<ImageViewerResult>>(DialogRef);
  protected readonly download = downloadUrl(this.data.url);
}