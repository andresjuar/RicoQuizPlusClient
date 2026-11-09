import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { FORBIDDEN_MESSAGE, errorInterceptor, toApiError } from './error.interceptor';
import { silent } from './http-context';

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

  it('usa el mensaje de la API en un 403', () => {
    const err = new HttpErrorResponse({ status: 403, error: { message: 'No eres el dueño de este quiz' } });
    expect(toApiError(err)).toMatchObject({ status: 403, message: 'No eres el dueño de este quiz' });
  });

  it('usa FORBIDDEN_MESSAGE en un 403 sin mensaje', () => {
    expect(toApiError(new HttpErrorResponse({ status: 403 })).message).toBe(FORBIDDEN_MESSAGE);
  });
});

describe('errorInterceptor', () => {
  const URL = '/api/test';
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toast: { error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };
  let auth: { isAuthenticated: ReturnType<typeof vi.fn>; clearSession: ReturnType<typeof vi.fn> };
  let router: { url: string; navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    toast = { error: vi.fn(), warning: vi.fn() };
    auth = { isAuthenticated: vi.fn(() => true), clearSession: vi.fn() };
    router = { url: '/quizzes/mine', navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toast },
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('en un 403 muestra un aviso con el mensaje de la API sin cerrar sesión ni navegar', () => {
    const onError = vi.fn();
    http.get(URL).subscribe({ error: onError });
    httpMock.expectOne(URL).flush({ message: 'No eres el dueño de este quiz' }, { status: 403, statusText: 'Forbidden' });

    expect(toast.warning).toHaveBeenCalledWith('No eres el dueño de este quiz');
    expect(toast.error).not.toHaveBeenCalled();
    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it('en un 403 silencioso no muestra ningún toast', () => {
    http.get(URL, { context: silent() }).subscribe({ error: () => undefined });
    httpMock.expectOne(URL).flush({ message: 'Activa tu cuenta' }, { status: 403, statusText: 'Forbidden' });

    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(auth.clearSession).not.toHaveBeenCalled();
  });

  it('en un 401 con sesión abierta cierra la sesión y manda al login (sin cambios)', () => {
    http.get(URL).subscribe({ error: () => undefined });
    httpMock.expectOne(URL).flush({ message: 'Token inválido' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.clearSession).toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith('Tu sesión expiró. Vuelve a iniciar sesión.');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/quizzes/mine' } });
  });
});
