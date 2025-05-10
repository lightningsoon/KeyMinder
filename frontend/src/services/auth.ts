import api from './api';

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
  token: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 注册
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

// 登录
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

// 获取当前用户信息
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<{ user: User }>('/auth/me');
  return response.data.user;
};

// 登出
export const logout = (): void => {
  localStorage.removeItem('token');
};
