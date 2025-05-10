import axios from 'axios';


const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8009';

console.log(`API configured with URL: ${API_URL} (${isDev ? 'development' : 'production'} mode)`);
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 5000, // 5秒超时
});

// 请求拦截器，添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// 添加响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理网络错误
    if (!error.response) {
      console.error('网络错误:', error.message);
      // 可以在这里添加全局网络错误处理逻辑
    }
    
    // 处理特定状态码
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.log('未授权，可能需要重新登录');
          // 可以在这里处理登录过期逻辑
          // 例如: localStorage.removeItem('token');
          break;
        case 404:
          console.log('请求的资源不存在');
          break;
        case 500:
          console.log('服务器错误');
          break;
        default:
          console.log(`请求失败，状态码: ${error.response.status}`);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
