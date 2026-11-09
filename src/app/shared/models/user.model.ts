export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isActive: boolean;
  authProvider: 'local' | 'google';
  createdAt: string;
}

/** Rol en la app, derivado de la sesión (la API no manda campo `role`): sin sesión = invitado */
export type UserRole = 'invitado' | 'user';

/** POST /auth/login y POST /auth/google */
export interface AuthResponse {
  token: string;
  user: User;
}

/** POST /auth/register: trae token solo si la activación por correo está apagada */
export interface RegisterResponse {
  message: string;
  requiresActivation: boolean;
  user: User;
  token?: string;
}