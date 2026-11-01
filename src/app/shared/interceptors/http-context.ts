import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Marca una petición cuyo error lo muestra el propio componente (p. ej. login, que pinta
 * el mensaje bajo el formulario). El interceptor de errores no lanza toast para esas.
 */
export const SILENT_ERROR = new HttpContextToken<boolean>(() => false);

export const silent = () => new HttpContext().set(SILENT_ERROR, true);
