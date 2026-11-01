import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, RegisterResponse, User } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

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
   * Se corre una vez al arrancar la app (provideAppInitializer en app.config.ts):
   * si hay token guardado, pide el usuario a /auth/me antes de que corran los guards.
   * Si el token ya no sirve, lo borra y la app arranca sin sesión.
   */
  restoreSession(): Promise<void> {
    if (!this.tokenStorage.get()) return Promise.resolve();

    return firstValueFrom(
      this.http.get<{ user: User }>(`${this.url}/me`).pipe(
        tap(({ user }) => this._user.set(user)),
        map(() => undefined),
        catchError(() => {
          this.tokenStorage.clear();
          return of(undefined);
        }),
      ),
    );
  }

  /** POST /auth/login */
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.url}/login`, { email, password })
      .pipe(map(res => this.startSession(res)));
  }

  /** POST /auth/google — credential = ID token de Google Identity Services (N8) */
  loginWithGoogle(credential: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.url}/google`, { credential })
      .pipe(map(res => this.startSession(res)));
  }

  /** POST /auth/register — si la API no exige activación, ya regresa token y se inicia sesión */
  register(displayName: string, email: string, password: string): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>(`${this.url}/register`, { displayName, email, password })
      .pipe(tap(res => res.token && this.startSession({ token: res.token, user: res.user })));
  }

  /** GET /auth/activate/:token */
  activate(token: string): Observable<void> {
    return this.http.get(`${this.url}/activate/${token}`).pipe(map(() => undefined));
  }

  /** POST /auth/resend-activation */
  resendActivation(email: string): Observable<void> {
    return this.http.post(`${this.url}/resend-activation`, { email }).pipe(map(() => undefined));
  }

  logout(): void {
    this.tokenStorage.clear();
    this._user.set(null);
    this.router.navigateByUrl('/');
  }

  private startSession({ token, user }: AuthResponse): User {
    this.tokenStorage.set(token);
    this._user.set(user);
    return user;
  }
}