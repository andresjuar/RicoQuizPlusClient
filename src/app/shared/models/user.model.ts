export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isActive: boolean;
  authProvider: 'local' | 'google';
  createdAt: string;
}

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