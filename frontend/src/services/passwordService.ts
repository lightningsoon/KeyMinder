import axios from 'axios';

interface PasswordItem {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

interface PasswordCreateData {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  tags?: string;
}

interface PasswordUpdateData {
  title?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  category?: string;
  tags?: string;
}

interface GeneratePasswordOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

// 获取所有密码条目
export const getAllPasswordItems = async (): Promise<PasswordItem[]> => {
  const response = await axios.get('/api/passwords');
  return response.data.passwordItems;
};

// 获取单个密码条目
export const getPasswordItem = async (id: string): Promise<PasswordItem> => {
  const response = await axios.get(`/api/passwords/${id}`);
  return response.data.passwordItem;
};

// 创建新密码条目
export const createPasswordItem = async (data: PasswordCreateData): Promise<PasswordItem> => {
  const response = await axios.post('/api/passwords', data);
  return response.data.passwordItem;
};

// 更新密码条目
export const updatePasswordItem = async (id: string, data: PasswordUpdateData): Promise<PasswordItem> => {
  const response = await axios.put(`/api/passwords/${id}`, data);
  return response.data.passwordItem;
};

// 删除密码条目
export const deletePasswordItem = async (id: string): Promise<void> => {
  await axios.delete(`/api/passwords/${id}`);
};

// 生成随机密码
export const generatePassword = async (options: GeneratePasswordOptions = {}): Promise<string> => {
  const { length = 12, includeUppercase = true, includeLowercase = true, includeNumbers = true, includeSymbols = false } = options;
  
  const queryParams = new URLSearchParams({
    length: length.toString(),
    includeUppercase: includeUppercase.toString(),
    includeLowercase: includeLowercase.toString(),
    includeNumbers: includeNumbers.toString(),
    includeSymbols: includeSymbols.toString()
  });
  
  const response = await axios.get(`/api/passwords/generate/password?${queryParams}`);
  return response.data.password;
};
