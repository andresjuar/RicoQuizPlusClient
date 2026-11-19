import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core'
import { registerLocaleData } from '@angular/common'
import localeEsMx from '@angular/common/locales/es-MX'
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { routes } from './app.routes'
import { authInterceptor } from './shared/interceptors/auth.interceptor'
import { errorInterceptor } from './shared/interceptors/error.interceptor'
import { AuthService } from './shared/services/auth.service'
import { SocketService } from './shared/services/socket.service'

registerLocaleData(localeEsMx)

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(), // :code y :id llegan como input()
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    // Restaura la sesión (GET /auth/me) antes de la primera navegación, para que authGuard ya la vea
    provideAppInitializer(() => inject(AuthService).restoreSession()),
    // Crea la conexión única de Socket.IO: se abre sola al iniciar sesión y se cierra al cerrarla
    provideAppInitializer(() => void inject(SocketService)),
    { provide: LOCALE_ID, useValue: 'es-MX' }
  ]
}
