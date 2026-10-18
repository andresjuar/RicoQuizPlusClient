import { Injectable, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { Observable, delay, map, of, switchMap, tap, throwError, timer } from 'rxjs'
import { User } from '../models/user.model'
import { MOCK_USER } from '../mocks/mock-data'
import { TokenStorageService } from './token-storage.service'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenStorage = inject(TokenStorageService)
  private readonly router = inject(Router)

  // Si hay token guardado, se restaura la sesión al recargar
  private readonly _user = signal<User | null>(this.tokenStorage.get() ? MOCK_USER : null)

  readonly user = this._user.asReadonly()
  readonly isAuthenticated = computed(() => this._user() !== null)

  // TODO integración: POST /auth/login
  login (email: string, password: string): Observable<User> {
    // Esto está comentado solo para la captura del error
    if (email === 'error@test.com') {
      return timer(600).pipe(
        switchMap(() => throwError(() => new Error('Correo o contraseña incorrectos.')))
      )
    }
    return of(MOCK_USER).pipe(
      delay(600),
      tap(user => {
        this.tokenStorage.set('mock-jwt-token')
        this._user.set(user)
      })
    )
  }

  // TODO integración: POST /auth/register
  register (displayName: string, email: string, password: string): Observable<void> {
    if (email === 'error@test.com') {
      return timer(700).pipe(
        switchMap(() => throwError(() => new Error('Ese correo ya está registrado.')))
      )
    }
    return timer(700).pipe(map(() => undefined))
  }

  // TODO integración: GET /auth/activate/:token
  activate (token: string): Observable<void> {
    if (token === 'expired') {
      return timer(900).pipe(
        switchMap(() => throwError(() => new Error('El enlace es inválido o ya expiró.')))
      )
    }
    return timer(900).pipe(map(() => undefined))
  }

  // TODO integración: POST /auth/resend-activation
  resendActivation (email: string): Observable<void> {
    return timer(600).pipe(map(() => undefined))
  }

  logout (): void {
    this.tokenStorage.clear()
    this._user.set(null)
    this.router.navigateByUrl('/')
  }
}
