import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { QuizService } from '../services/quiz.service';
import { ownerGuard } from './owner.guard';

describe('ownerGuard', () => {
  let userId: string | undefined;
  let quiz$: Observable<unknown>;

  const run = () => {
    const route = { paramMap: convertToParamMap({ id: 'q1' }) } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => ownerGuard(route, {} as RouterStateSnapshot)) as Promise<boolean | UrlTree>;
  };

  beforeEach(() => {
    userId = 'u1';
    quiz$ = of({ owner: { _id: 'u1' } });

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { whenReady: () => Promise.resolve(), user: () => (userId ? { _id: userId } : null) } },
        { provide: QuizService, useValue: { getById: () => quiz$ } },
      ],
    });
  });

  it('deja pasar al dueño', async () => {
    expect(await run()).toBe(true);
  });

  it('manda a /403 a quien no es dueño', async () => {
    quiz$ = of({ owner: { _id: 'otro' } });
    const result = await run();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/403');
  });

  it('deja pasar si la petición falla (el formulario muestra el error)', async () => {
    quiz$ = throwError(() => ({ status: 404 }));
    expect(await run()).toBe(true);
  });

  it('deja pasar sin sesión (lo decide authGuard)', async () => {
    userId = undefined;
    expect(await run()).toBe(true);
  });
});
