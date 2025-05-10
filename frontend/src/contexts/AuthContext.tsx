import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios, { AxiosInstance, CancelTokenSource } from 'axios';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8009';

// 创建一个独立的 axios 实例，而不是修改全局默认值
const createAuthAPI = (token: string | null): AxiosInstance => {
  const api = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10秒超时
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  
  // 添加响应拦截器处理常见错误
  api.interceptors.response.use(
    response => response,
    error => {
      // 处理网络错误
      if (!error.response) {
        console.error('网络错误:', error.message);
      }
      return Promise.reject(error);
    }
  );
  
  return api;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState(() => createAuthAPI(token));
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);

  // 当 token 变化时，更新 API 实例
  useEffect(() => {
    setApi(createAuthAPI(token));
  }, [token]);

  // 在组件挂载时检查用户是否已登录
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      // 创建取消令牌
      cancelTokenRef.current = axios.CancelToken.source();
      
      try {
        const response = await api.get('/api/auth/me', {
          cancelToken: cancelTokenRef.current.token
        });
        setUser(response.data.user);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('请求已取消:', error.message);
        } else {
          console.error('认证错误:', error);
          // 只有在非取消错误的情况下才清除认证状态
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
    
    // 清理函数 - 取消未完成的请求
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('组件卸载，取消请求');
        cancelTokenRef.current = null;
      }
    };
  }, [token, api]);

  // 登录函数
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('登录错误:', error);
      
      // 更详细的错误处理
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // 服务器返回了错误响应
          const status = error.response.status;
          const errorData = error.response.data;
          
          if (status === 401) {
            throw new Error('邮箱或密码不正确');
          } else if (status === 429) {
            throw new Error('登录尝试次数过多，请稍后再试');
          } else if (errorData.message) {
            throw new Error(errorData.message);
          }
        } else if (error.request) {
          // 请求已发送但没有收到响应
          throw new Error('无法连接到服务器，请检查您的网络连接');
        }
      }
      
      // 默认错误
      throw error;
    }
  };

  // 注册函数
  const register = async (email: string, username: string, password: string) => {
    try {
      const response = await api.post('/api/auth/register', { email, username, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('注册错误:', error);
      
      // 更详细的错误处理
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          
          if (status === 409) {
            throw new Error('该邮箱或用户名已被注册');
          } else if (status === 400) {
            throw new Error(errorData.message || '注册信息无效');
          } else if (errorData.message) {
            throw new Error(errorData.message);
          }
        } else if (error.request) {
          throw new Error('无法连接到服务器，请检查您的网络连接');
        }
      }
      
      throw error;
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 自定义 hook 以便在组件中使用
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
