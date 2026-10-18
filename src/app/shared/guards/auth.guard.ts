import { CanActivateFn } from '@angular/router';

// TODO Issue 8: validar sesión y redirigir a /login
export const authGuard: CanActivateFn = () => true;