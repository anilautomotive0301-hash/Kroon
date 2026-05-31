import { authApi } from './api';
import type { User } from '@/types';

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeAuth(data: { user: User; accessToken: string; refreshToken: string }) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', data.user.id);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('user');
}

export async function login(email: string, password: string) {
  const data = await authApi.login(email, password);
  storeAuth(data);
  return data.user as User;
}

export async function logout() {
  try {
    await authApi.logout();
  } finally {
    clearAuth();
  }
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem('accessToken');
}
