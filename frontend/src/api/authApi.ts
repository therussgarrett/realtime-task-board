import { apiUrl } from '../config/api';

export interface AuthResponse {
  success: boolean;
  message: string;
  user: { id: string; email: string };
  token: string;
}
const API_BASE = '/api';

export const authApi = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw await res.json();

    return res.json();
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw await res.json();

    return res.json();
  },
};