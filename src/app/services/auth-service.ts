import { apiClient } from './api-client';

export interface LoginRequest {
  username: string;
  password: string;
  role?: 'nurse' | 'physician';
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
    avatar: string;
  };
}

export interface User {
  id: string;
  name: string;
  fullName: string;
  role: string;
  avatar: string;
  email?: string;
  username?: string;
}

/**
 * Authenticate user with credentials
 * POST /auth/login
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    username: credentials.username,
    password: credentials.password,
  });
  apiClient.setToken(response.token);
  return response;
}

/**
 * Logout user
 * POST /auth/logout
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post<void>('/auth/logout', {});
  } catch {
    // Ignore errors on logout
  }
  apiClient.clearToken();
}

/**
 * Get current authenticated user
 * GET /auth/me
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<any>('/auth/me');
  return {
    id: response.id,
    name: response.name,
    fullName: response.name,
    role: response.role,
    avatar: response.avatar,
    username: response.name,
  };
}
