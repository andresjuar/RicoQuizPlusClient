import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError, ApiErrorBody } from '../models/api.model';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { SILENT_ERROR } from './http-context';

const WAKING_MESSAGE =
  'No pudimos conectar con el servidor. Si estuvo inactivo puede tardar hasta un minuto en despertar; intenta de nuevo.';

/** Único lugar donde se manejan los errores HTTP: normaliza a ApiError, avisa al usuario y cierra sesión en 401. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      // Errores que no son HTTP (bugs en un map, etc.) se dejan pasar tal cual
      if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

      const error = toApiError(err);

      // Token vencido o inválido con sesión abierta: se cierra y se manda al login
      if (error.status === 401 && auth.isAuthenticated()) {
        auth.clearSession();
        toast.warning('Tu sesión expiró. Vuelve a iniciar sesión.');
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        return throwError(() => error);
      }

      if (!req.context.get(SILENT_ERROR)) {
        toast.error(error.message);
      }

      return throwError(() => error);
    }),
  );
};

/** Convierte cualquier HttpErrorResponse en un ApiError con mensaje para el usuario. */
export function toApiError(err: HttpErrorResponse): ApiError {
  // status 0 = sin respuesta (sin internet, CORS o Render dormido); 502-504 = Render arrancando
  if (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) {
    return new ApiError(WAKING_MESSAGE, err.status);
  }

  const body = err.error as Partial<ApiErrorBody> | null;
  const details = Array.isArray(body?.errores) ? body.errores : [];

  if (err.status >= 500) {
    return new ApiError('Ocurrió un error en el servidor. Intenta más tarde.', err.status);
  }

  // Validación (400 con errores[]): se muestra el primer detalle, que es más útil que "Error de validación"
  const message = details[0] ?? body?.message ?? 'No se pudo completar la operación.';
  return new ApiError(message, err.status, details);
}
