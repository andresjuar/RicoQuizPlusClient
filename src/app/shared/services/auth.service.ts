import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, delay, of, tap } from 'rxjs';
import { User } from '../models/user.model';
import { MOCK_USER } from '../mocks/mock-data';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  // Si hay token guardado, se restaura la sesión al recargar
  private readonly _user = signal<User | null>(this.tokenStorage.get() ? MOCK_USER : null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  // TODO integración: POST /auth/login
  login(email: string, password: string): Observable<User> {
    return of(MOCK_USER).pipe(
      delay(600),
      tap(user => {
        this.tokenStorage.set('mock-jwt-token');
        this._user.set(user);
      }),
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this._user.set(null);
    this.router.navigateByUrl('/');
  }
}