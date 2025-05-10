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
console.log('Using API URL:', API_URL);
// 创建一个独立的 axios 实例，而不是修改全局默认值
const createAuthAPI = (token: string | null): AxiosInstance => {
  const api = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10秒超时
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,  // 确保跨域请求发送凭证
  });
   console.log('API instance created:', api);
  console.log('API methods available:', Object.keys(api));
  // 添加响应拦截器处理常见错误
  api.interceptors.request.use(
    config => {
      console.log('发送请求:', config.method, config.url, config);
      return config;
    },
    error => {
      console.error('请求错误:', error);
      return Promise.reject(error);
    }
  );
  api.interceptors.response.use(
    response => {
      console.log('收到响应:', response.status, response.config.url);
      return response;
    },
    error => {
      if (error.response) {
        console.error('响应错误:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('请求错误 (无响应):', error.request);
      } else {
        console.error('设置请求时出错:', error.message);
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
  const apiRef = useRef<AxiosInstance | null>(null);
// 初始化 API 实例
  useEffect(() => {
    try {
      console.log('Creating API instance with token:', token ? '(token exists)' : 'null');
      apiRef.current = createAuthAPI(token);
      console.log('API instance created successfully');
    } catch (error) {
      console.error('Failed to create API instance:', error);
    }
  }, [token]);

  // 检查用户认证状态
  useEffect(() => {
    if (!token || !apiRef.current) {
      setIsLoading(false);
      return;
    }
    
    const checkAuthStatus = async () => {
      // 创建取消令牌
      const cancelToken = axios.CancelToken.source();
      
      try {
        console.log('Checking auth status...');
        const response = await apiRef.current.get('/api/auth/me', {
          cancelToken: cancelToken.token
        });
        console.log('Auth status response:', response.data);
        setUser(response.data.user);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request cancelled:', error.message);
        } else {
          console.error('Authentication error:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
    
    return () => {
      // 清理逻辑
    };
  }, [token]);


  // 登录函数
  const login = async (email: string, password: string) => {
    try {
      if (!apiRef.current) {
        apiRef.current = createAuthAPI(token);
      }
    const response = await apiRef.current.post('/api/auth/login', { email, password });
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
      if (!apiRef.current) {
        apiRef.current = createAuthAPI(token);
      }
      const response = await apiRef.current.post('/api/auth/register', { email, username, password });
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
