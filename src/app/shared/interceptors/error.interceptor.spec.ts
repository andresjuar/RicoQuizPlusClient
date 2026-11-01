import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './error.interceptor';

describe('toApiError', () => {
  it('usa el mensaje de la API en errores 4xx', () => {
    const err = new HttpErrorResponse({ status: 404, error: { message: 'Quiz no encontrado' } });
    expect(toApiError(err)).toMatchObject({ status: 404, message: 'Quiz no encontrado' });
  });

  it('muestra el primer detalle en errores de validación', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { message: 'Error de validación', errores: ['El título es requerido', 'Faltan preguntas'] },
    });
    const apiError = toApiError(err);
    expect(apiError.message).toBe('El título es requerido');
    expect(apiError.details).toHaveLength(2);
  });

  it('trata status 0 y 503 como servidor dormido', () => {
    for (const status of [0, 503]) {
      expect(toApiError(new HttpErrorResponse({ status })).message).toContain('despertar');
    }
  });

  it('no expone detalles internos en errores 500', () => {
    const err = new HttpErrorResponse({ status: 500, error: { message: 'Error del servidor' } });
    expect(toApiError(err).message).toBe('Ocurrió un error en el servidor. Intenta más tarde.');
  });
});
