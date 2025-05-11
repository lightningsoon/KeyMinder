import React, { createContext, useState, useEffect, useContext, useRef, ReactNode } from 'react';
import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';

// 定义环境变量类型
interface ImportMeta {
  env: {
    VITE_API_BASE_URL: string;
  };
}

// 定义用户类型
interface User {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

// 定义认证响应类型
interface AuthResponse {
  token: string;
  user: User;
}

// 定义上下文类型
interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// 定义 Provider 属性类型
interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 从环境变量获取API URL，提供明确的后备值
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8009';
console.log('Using API URL:', API_URL);

// 创建API实例函数
const createAuthAPI = (token: string | null): AxiosInstance => {
  const config: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  };
  return axios.create(config);
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    // 从localStorage读取token，并验证格式
    const savedToken = localStorage.getItem('token');
    if (savedToken && savedToken.length > 10) { // 简单验证token格式
      return savedToken;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const apiRef = useRef<AxiosInstance | null>(null);
  
  // 初始化 API 实例
  useEffect(() => {
    try {
      apiRef.current = createAuthAPI(token);
      console.log('API实例创建成功，baseURL:', apiRef.current.defaults.baseURL);
    } catch (error) {
      console.error('创建API实例失败:', error);
    }
  }, [token]);

  // 检查用户认证状态
  useEffect(() => {
    if (!token || !apiRef.current) {
      console.log('无token或API实例，跳过认证检查');
      setIsLoading(false);
      return;
    }
    
    let isMounted = true;
    const cancelToken = axios.CancelToken.source();
    
    const checkAuthStatus = async () => {
      try {
        console.log('检查认证状态...');
        const response = await apiRef.current!.get('/api/auth/me', {
          cancelToken: cancelToken.token
        });
        
        console.log('认证状态响应:', response.data);
        
        if (isMounted && response.data && response.data.user) {
          setUser(response.data.user);
        } else {
          console.warn('认证响应缺少用户数据:', response.data);
          // 如果响应中没有用户数据，可能是API结构不匹配
          if (isMounted) {
            setToken(null);
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('认证请求已取消');
        } else {
          console.error('认证检查错误:', error);
          
          if (isMounted) {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuthStatus();
    
    return () => {
      isMounted = false;
      cancelToken.cancel('组件卸载');
    };
  }, [token]);

  // 登录函数
  const login = async (username: string, password: string) => {
    try {
      console.log('尝试登录:', { username }); // 不记录密码
      
      if (!apiRef.current) {
        console.log('重新创建API实例用于登录');
        apiRef.current = createAuthAPI(null); // 登录不需要token
      }
      
      // 确保API实例存在
      if (!apiRef.current) {
        throw new Error('无法创建API实例');
      }
      
      const response = await apiRef.current.post<AuthResponse>('/api/auth/login', { username, password });
      console.log('登录响应状态:', response.status);
      
      const { token: newToken, user: userData } = response.data;
      
      if (!newToken) {
        console.error('登录响应中没有令牌:', response.data);
        throw new Error('登录响应中没有令牌');
      }
      
      // 存储令牌和用户数据
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      console.log('登录成功，用户:', userData.username);
    } catch (error) {
      // 详细的错误处理
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          // 服务器返回了错误状态码
          const status = axiosError.response.status;
          const errorData = axiosError.response.data as { message?: string };
          
          console.error('登录失败 - 服务器响应:', {
            status: status,
            data: errorData,
            url: axiosError.config?.url
          });
          
          if (status === 401) {
            throw new Error('用户名或密码不正确');
          } else if (status === 429) {
            throw new Error('登录尝试次数过多，请稍后再试');
          } else if (errorData && errorData.message) {
            throw new Error(errorData.message);
          } else {
            throw new Error(`服务器错误 (${status})`);
          }
        } else if (axiosError.request) {
          // 请求已发送但没有收到响应
          console.error('登录失败 - 无响应:', {
            request: axiosError.request,
            config: axiosError.config
          });
          
          // 检查网络连接和API URL
          console.log('网络状态:', navigator.onLine ? '在线' : '离线');
          console.log('API URL:', API_URL);
          console.log('完整请求URL:', axiosError.config?.baseURL + axiosError.config?.url);
          
          throw new Error('无法连接到服务器，请检查您的网络连接');
        } else {
          // 设置请求时发生错误
          console.error('登录失败 - 请求错误:', axiosError.message);
          throw new Error('请求错误: ' + axiosError.message);
        }
      } else {
        // 非Axios错误
        console.error('登录过程中发生未知错误:', error);
        throw error;
      }
    }
  };

  // 注册函数
  const register = async (username: string, password: string) => {
    try {
      console.log('尝试注册:', { username }); // 不记录密码
      
      if (!apiRef.current) {
        console.log('重新创建API实例用于注册');
        apiRef.current = createAuthAPI(null); // 注册不需要token
      }
      
      // 确保API实例存在
      if (!apiRef.current) {
        throw new Error('无法创建API实例');
      }
      
      const response = await apiRef.current.post<AuthResponse>(
        '/api/auth/register', 
        { username, password }
      );
      
      console.log('注册响应状态:', response.status);
      
      const { token: newToken, user: userData } = response.data;
      
      if (!newToken || !userData) {
        console.error('注册响应数据不完整:', response.data);
        throw new Error('注册成功但返回数据不完整');
      }
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      console.log('注册成功，用户:', userData.username);
    } catch (error) {
      // 详细的错误处理
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          const errorData = error.response.data;
          
          console.error('注册失败 - 服务器响应:', {
            status: status,
            data: errorData
          });
          
          if (status === 409) {
            throw new Error('该用户名已被注册');
          } else if (status === 400) {
            throw new Error(errorData.message || '注册信息无效');
          } else if (errorData && errorData.message) {
            throw new Error(errorData.message);
          } else {
            throw new Error(`服务器错误 (${status})`);
          }
        } else if (error.request) {
          console.error('注册失败 - 无响应:', {
            request: error.request,
            config: error.config
          });
          
          throw new Error('无法连接到服务器，请检查您的网络连接');
        } else {
          console.error('注册失败 - 请求错误:', error.message);
          throw new Error('请求错误: ' + error.message);
        }
      } else {
        console.error('注册过程中发生未知错误:', error);
        throw error;
      }
    }
  };

  // 登出函数
  const logout = () => {
    console.log('用户登出');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    // 可选：创建新的无token的API实例
    apiRef.current = createAuthAPI(null);
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
