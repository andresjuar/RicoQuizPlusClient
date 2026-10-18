import { CanActivateFn } from '@angular/router';

// TODO Issue 30: si hay sesión, redirigir a /dashboard
export const guestGuard: CanActivateFn = () => true;