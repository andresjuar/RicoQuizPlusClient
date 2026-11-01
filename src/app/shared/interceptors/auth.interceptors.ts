import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../services/token-storage.service';

/** Agrega Authorization: Bearer <token> a las peticiones a NUESTRA API (no a Google, Cloudinary, etc.) */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorageService).get();

  if (!token || !req.url.startsWith(environment.apiUrl)) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};