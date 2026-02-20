export type AppRole = 'User' | 'Insurer' | 'Admin';

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: AppRole;

  createdAt?: string | null;
  lastLoginAt?: string | null;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};
