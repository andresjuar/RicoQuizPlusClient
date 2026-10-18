export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}