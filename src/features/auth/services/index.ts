import api from '@/lib/axios';

export type LoginPayload = { email: string; password: string };
export type AuthUser = { id: string; email: string; role: string };
export type AuthResponse = { access_token: string; user: AuthUser };

export const login = (payload: LoginPayload) =>
  api.post<AuthResponse>('/auth/login', payload).then((r) => r.data);
