import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { silent } from '../interceptors/http-context';
import { environment } from '../../../environments/environment';
import { AuthResponse, RegisterResponse, User, UserRole } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

/** Máximo que la app espera a /auth/me antes de mostrarse (Render dormido tarda ~1 min) */
const RESTORE_WAIT_MS = 5000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  /**
   * Rol en la app: 'user' con sesión, 'invitado' sin ella.
   * No confundir con host/player (PlayerRole en pages/play/game-shell.ts), que son roles de la partida.
   */
  readonly role = computed<UserRole>(() => (this._user() ? 'user' : 'invitado'));

  /** true si el rol actual es alguno de los indicados */
  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this.role());
  }

  /** true mientras se revisa el token guardado; la app muestra el aviso "Conectando con el servidor…" */
  private readonly _restoring = signal(false);
  readonly restoring = this._restoring.asReadonly();
  private sessionCheck: Promise<void> = Promise.resolve();

  /**
   * Se corre una vez al arrancar la app (provideAppInitializer en app.config.ts):
   * si hay token guardado, pide el usuario a /auth/me.
   * - Solo un 401 borra el token; si el servidor no responde, el token se conserva.
   * - La app espera como máximo RESTORE_WAIT_MS; si /auth/me tarda más (Render dormido),
   *   la app se muestra y los guards esperan con whenReady().
   */
  restoreSession(): Promise<void> {
    if (!this.tokenStorage.get()) return Promise.resolve();

    this._restoring.set(true);
    this.sessionCheck = firstValueFrom(
      this.http.get<{ user: User }>(`${this.url}/me`, { context: silent() }).pipe(
        tap(({ user }) => this._user.set(user)),
        map(() => undefined),
        catchError((err: unknown) => {
          if (err instanceof HttpErrorResponse ? err.status === 401 : (err as { status?: number }).status === 401) {
            this.tokenStorage.clear();
          }
          return of(undefined);
        }),
      ),
    ).finally(() => this._restoring.set(false));

    const maxWait = new Promise<void>(resolve => setTimeout(resolve, RESTORE_WAIT_MS));
    return Promise.race([this.sessionCheck, maxWait]);
  }

  /** Lo usan los guards: se resuelve cuando ya se sabe si hay sesión */
  whenReady(): Promise<void> {
    return this.sessionCheck;
  }

  /** POST /auth/login */
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.url}/login`, { email, password }, { context: silent() })
      .pipe(map(res => this.startSession(res)));
  }

  /** POST /auth/google — credential = ID token de Google Identity Services (N8) */
  loginWithGoogle(credential: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.url}/google`, { credential }, { context: silent() })
      .pipe(map(res => this.startSession(res)));
  }

  /** POST /auth/register — si la API no exige activación, ya regresa token y se inicia sesión */
  register(displayName: string, email: string, password: string): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>(`${this.url}/register`, { displayName, email, password }, { context: silent() })
      .pipe(tap(res => res.token && this.startSession({ token: res.token, user: res.user })));
  }

  /** GET /auth/activate/:token */
  activate(token: string): Observable<void> {
    return this.http.get(`${this.url}/activate/${token}`, { context: silent() }).pipe(map(() => undefined));
  }

  /** POST /auth/resend-activation */
  resendActivation(email: string): Observable<void> {
    return this.http.post(`${this.url}/resend-activation`, { email }).pipe(map(() => undefined));
  }

  logout(): void {
    this.clearSession();
    this.router.navigateByUrl('/');
  }

  /** Borra token y usuario sin navegar (el interceptor lo usa en 401 y decide a dónde ir) */
  clearSession(): void {
    this.tokenStorage.clear();
    this._user.set(null);
  }

  private startSession({ token, user }: AuthResponse): User {
    this.tokenStorage.set(token);
    this._user.set(user);
    return user;
  }
}
