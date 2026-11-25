import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Observable } from 'rxjs';
import { ImageViewer, ImageViewerData, ImageViewerResult } from '../components/image-viewer/image-viewer';

@Injectable({ providedIn: 'root' })
export class ImageViewerService {
  private readonly dialog = inject(Dialog);

  open(data: ImageViewerData): Observable<ImageViewerResult> {
    const ref = this.dialog.open<ImageViewerResult, ImageViewerData>(ImageViewer, {
      data,
      width: '860px',
      maxWidth: 'calc(100vw - 32px)',
      backdropClass: 'rq-backdrop',
    });
    return ref.closed;
  }
}