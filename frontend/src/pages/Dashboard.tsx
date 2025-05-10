import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  TextInput,
  Paper,
  Text,
  ActionIcon,
  Menu,
  Modal,
  PasswordInput,
  Box,
  Select,
  Tabs,
  Badge,
  Card,
  Grid,
  Tooltip,
  Progress,
  Divider,
  Switch
} from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { 
  Lock, 
  Search, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Edit, 
  Trash, 
  Key, 
  Shield, 
  Settings, 
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Upload,
  Clipboard,
  User,
  FileText
} from 'lucide-react';

// 模拟密码数据
const dummyPasswords = [
  { id: 1, website: '示例-微信', url: 'https://wx.qq.com', username: 'user123', password: 'P@ssw0rd123', category: '社交媒体', lastUpdated: '2023-12-15' },
  { id: 2, website: '示例-淘宝', url: 'https://www.alipay.com', username: '188666688888', password: 'Secure!2025', category: '购物', lastUpdated: '2024-01-20' },
  { id: 3, website: '示例-抖音', url: 'https://www.douyin.com', username: 'xxx1386666666', password: 'mima!2025', category: '娱乐', lastUpdated: '2024-01-20' },
  { id: 4, website: '示例—银行', url: 'https://www.icbc.com.cn', username: '6222********1234', password: 'Bank@2025!', category: '金融', lastUpdated: '2024-02-05' }
];

// 密码安全性检查
const checkPasswordStrength = (password: string) => {
  if (password.length < 8) return { strength: 'weak', color: 'red' };
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) 
    return { strength: 'medium', color: 'yellow' };
  if (!/[^A-Za-z0-9]/.test(password)) return { strength: 'medium', color: 'yellow' };
  return { strength: 'strong', color: 'green' };
};

// 随机密码生成
const generatePassword = (length = 16, includeUpper = true, includeLower = true, includeNumbers = true, includeSymbols = true) => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  
  let chars = '';
  if (includeUpper) chars += upper;
  if (includeLower) chars += lower;
  if (includeNumbers) chars += numbers;
  if (includeSymbols) chars += symbols;
  
  if (chars === '') return '';
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
};

const Dashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const [passwords, setPasswords] = useState(dummyPasswords);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [securityStats, setSecurityStats] = useState({
    total: dummyPasswords.length,
    weak: 0,
    reused: 0,
    old: 0
  });
  const [passwordGeneratorOpen, setPasswordGeneratorOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 计算安全统计数据
  useEffect(() => {
    const weak = passwords.filter(p => checkPasswordStrength(p.password).strength === 'weak').length;
    
    // 检查重复密码
    const passwordMap = new Map();
    let reused = 0;
    passwords.forEach(p => {
      if (passwordMap.has(p.password)) {
        reused++;
      } else {
        passwordMap.set(p.password, true);
      }
    });
    
    // 检查超过90天未更新的密码
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const old = passwords.filter(p => {
      const updatedDate = new Date(p.lastUpdated);
      return updatedDate < ninetyDaysAgo;
    }).length;
    
    setSecurityStats({
      total: passwords.length,
      weak,
      reused,
      old
    });
  }, [passwords]);

  // 生成随机密码
  useEffect(() => {
    if (passwordGeneratorOpen) {
      handleGeneratePassword();
    }
  }, [passwordGeneratorOpen, passwordLength, includeUpper, includeLower, includeNumbers, includeSymbols]);

  // 过滤密码
  const filteredPasswords = passwords.filter(item => {
    const matchesSearch = 
      item.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'weak') return matchesSearch && checkPasswordStrength(item.password).strength === 'weak';
    if (activeTab === 'reused') {
      const count = passwords.filter(p => p.password === item.password).length;
      return matchesSearch && count > 1;
    }
    if (activeTab === 'old') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const updatedDate = new Date(item.lastUpdated);
      return matchesSearch && updatedDate < ninetyDaysAgo;
    }
    return matchesSearch && item.category.toLowerCase() === activeTab.toLowerCase();
  });

  // 切换密码可见性
  const togglePasswordVisibility = (id: number) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccessMessage('已复制到剪贴板');
  };

  // 显示成功消息
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 8009);
  };

  // 添加新密码
  const handleAddPassword = () => {
    // 实际应用中这里会调用API
    setAddModalOpen(false);
    showSuccessMessage('密码已成功添加');
  };

  // 编辑密码
  const handleEditPassword = () => {
    // 实际应用中这里会调用API
    setEditModalOpen(false);
    showSuccessMessage('密码已成功更新');
  };

  // 删除密码
  const handleDeletePassword = (id: number) => {
    // 实际应用中这里会调用API
    setPasswords(passwords.filter(p => p.id !== id));
    showSuccessMessage('密码已成功删除');
  };

  // 生成随机密码
  const handleGeneratePassword = () => {
    const newPassword = generatePassword(
      passwordLength,
      includeUpper,
      includeLower,
      includeNumbers,
      includeSymbols
    );
    setGeneratedPassword(newPassword);
  };

  // 导入密码
  const handleImportPasswords = () => {
    // 实际应用中这里会处理导入逻辑
    setImportExportModalOpen(false);
    showSuccessMessage('密码已成功导入');
  };

  // 导出密码
  const handleExportPasswords = () => {
    // 实际应用中这里会处理导出逻辑
    setImportExportModalOpen(false);
    showSuccessMessage('密码已成功导出');
  };

  return (
    <Container size="xl" py="xl">
      {/* 顶部导航栏 */}
      <Paper shadow="xs" p="md" mb="xl" withBorder>
        <Group position="apart">
          <Group>
            <Lock size={24} color="#228be6" />
            <Title order={3} color="blue.7">记着</Title>
          </Group>
          
          <Group>
            <Text size="sm" color="dimmed">欢迎, {user?.username || '用户'}</Text>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon size="lg" radius="xl" variant="light" color="blue">
                  <Settings size={20} />
                </ActionIcon>
              </Menu.Target>
              
              <Menu.Dropdown>
                <Menu.Label>账户</Menu.Label>
                <Menu.Item icon={<User size={14} />}>个人资料</Menu.Item>
                <Menu.Item icon={<Shield size={14} />}>安全中心</Menu.Item>
                <Menu.Divider />
                <Menu.Label>数据</Menu.Label>
                <Menu.Item 
                  icon={<RefreshCw size={14} />}
                  onClick={() => setPasswordGeneratorOpen(true)}
                >
                  密码生成器
                </Menu.Item>
                <Menu.Item 
                  icon={<FileText size={14} />}
                  onClick={() => setImportExportModalOpen(true)}
                >
                  导入/导出
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" icon={<LogOut size={14} />} onClick={logout}>
                  退出登录
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Paper>
      
      {/* 成功消息提示 */}
      {successMessage && (
        <Paper 
          p="md" 
          mb="md" 
          sx={{ 
            position: 'fixed', 
            bottom: 20, 
            right: 20, 
            zIndex: 1000,
            background: '#43a047',
            color: 'white'
          }}
        >
          <Group>
            <CheckCircle size={18} />
            <Text>{successMessage}</Text>
          </Group>
        </Paper>
      )}
      
      {/* 安全概览 */}
      <Paper shadow="sm" p="md" mb="xl" withBorder>
        <Title order={4} mb="md">安全概览</Title>
        <Grid>
          <Grid.Col span={3}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Group position="apart">
                <Text weight={500}>总密码数</Text>
                <Badge size="lg" radius="sm">{securityStats.total}</Badge>
              </Group>
              <Text size="sm" color="dimmed" mt="sm">
                您的密码保险箱中共有 {securityStats.total} 个密码
              </Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={3}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Group position="apart">
                <Text weight={500}>弱密码</Text>
                <Badge size="lg" color="red" radius="sm">{securityStats.weak}</Badge>
              </Group>
              <Text size="sm" color="dimmed" mt="sm">
                <AlertCircle size={14} style={{ display: 'inline', marginRight: 5 }} />
                {securityStats.weak} 个密码强度较弱，建议加强
              </Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={3}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Group position="apart">
                <Text weight={500}>重复使用</Text>
                <Badge size="lg" color="orange" radius="sm">{securityStats.reused}</Badge>
              </Group>
              <Text size="sm" color="dimmed" mt="sm">
                <AlertCircle size={14} style={{ display: 'inline', marginRight: 5 }} />
                {securityStats.reused} 个密码在多个网站重复使用
              </Text>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={3}>
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Group position="apart">
                <Text weight={500}>需要更新</Text>
                <Badge size="lg" color="yellow" radius="sm">{securityStats.old}</Badge>
              </Group>
              <Text size="sm" color="dimmed" mt="sm">
                <Clock size={14} style={{ display: 'inline', marginRight: 5 }} />
                {securityStats.old} 个密码超过90天未更新
              </Text>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>
      
      {/* 搜索和添加 */}
      <Group position="apart" mb="md">
        <TextInput
          placeholder="搜索网站、用户名或URL..."
          icon={<Search size={16} />}
          style={{ width: '60%' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />
        
        <Button 
          leftIcon={<Plus size={16} />} 
          onClick={() => setAddModalOpen(true)}
          color="blue"
        >
          添加密码
        </Button>
      </Group>
      
      {/* 分类标签 */}
      <Tabs value={activeTab} onTabChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="all" icon={<Key size={14} />}>
            全部
          </Tabs.Tab>
          <Tabs.Tab 
            value="weak" 
            icon={<AlertCircle size={14} />}
            color="red"
            rightSection={
              securityStats.weak > 0 ? <Badge color="red" size="xs" variant="filled">{securityStats.weak}</Badge> : null
            }
          >
            弱密码
          </Tabs.Tab>
          <Tabs.Tab 
            value="reused" 
            icon={<AlertCircle size={14} />}
            color="orange"
            rightSection={
              securityStats.reused > 0 ? <Badge color="orange" size="xs" variant="filled">{securityStats.reused}</Badge> : null
            }
          >
            重复使用
          </Tabs.Tab>
          <Tabs.Tab 
            value="old" 
            icon={<Clock size={14} />}
            color="yellow"
            rightSection={
              securityStats.old > 0 ? <Badge color="yellow" size="xs" variant="filled">{securityStats.old}</Badge> : null
            }
          >
            需要更新
          </Tabs.Tab>
          <Tabs.Tab value="社交媒体" icon={<Key size={14} />}>社交媒体</Tabs.Tab>
          <Tabs.Tab value="金融" icon={<Key size={14} />}>金融</Tabs.Tab>
          <Tabs.Tab value="购物" icon={<Key size={14} />}>购物</Tabs.Tab>
          <Tabs.Tab value="工作" icon={<Key size={14} />}>工作</Tabs.Tab>
          <Tabs.Tab value="娱乐" icon={<Key size={14} />}>娱乐</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      
      {/* 密码列表 */}
      {filteredPasswords.length === 0 ? (
        <Paper p="xl" withBorder>
          <Text align="center" color="dimmed">没有找到匹配的密码</Text>
        </Paper>
      ) : (
        filteredPasswords.map((item) => {
          const strength = checkPasswordStrength(item.password);
          return (
            <Paper key={item.id} p="md" withBorder mb="md" shadow="sm">
              <Group position="apart">
                <div>
                  <Group>
                    <Title order={5}>{item.website}</Title>
                    <Badge 
                      size="sm" 
                      color={strength.color}
                      variant="dot"
                    >
                      {strength.strength === 'weak' ? '弱' : strength.strength === 'medium' ? '中' : '强'}
                    </Badge>
                  </Group>
                  <Text size="sm" color="dimmed" mt={5}>{item.url}</Text>
                  <Group mt={10}>
                    <Text size="sm">用户名: {item.username}</Text>
                    <ActionIcon size="sm" onClick={() => copyToClipboard(item.username)}>
                      <Copy size={14} />
                    </ActionIcon>
                  </Group>
                  <Group mt={5}>
                    <Text size="sm">
                      密码: {showPassword[item.id] ? item.password : '••••••••••'}
                    </Text>
                    <ActionIcon size="sm" onClick={() => togglePasswordVisibility(item.id)}>
                      {showPassword[item.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </ActionIcon>
                    <ActionIcon size="sm" onClick={() => copyToClipboard(item.password)}>
                      <Copy size={14} />
                    </ActionIcon>
                  </Group>
                  <Text size="xs" color="dimmed" mt={5}>上次更新: {item.lastUpdated}</Text>
                </div>
                
                <Group>
                  <Tooltip label="编辑">
                    <ActionIcon 
                      color="blue" 
                      variant="light"
                      onClick={() => {
                        setCurrentPassword(item);
                        setEditModalOpen(true);
                      }}
                    >
                      <Edit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="删除">
                    <ActionIcon 
                      color="red" 
                      variant="light"
                      onClick={() => handleDeletePassword(item.id)}
                    >
                      <Trash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Paper>
          );
        })
      )}
      
      {/* 添加密码模态框 */}
      <Modal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="添加新密码"
        size="md"
      >
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleAddPassword(); }}>
          <TextInput
            label="网站名称"
            placeholder="例如: 微信"
            required
            mb="md"
          />
          
          <TextInput
            label="网站URL"
            placeholder="例如: https://wx.qq.com"
            mb="md"
          />
          
          <TextInput
            label="用户名/邮箱"
            placeholder="您的登录用户名或邮箱"
            required
            mb="md"
          />
          
          <Group mb="md" grow>
            <PasswordInput
              label="密码"
              placeholder="您的密码"
              required
            />
            <Button 
              variant="light" 
              onClick={() => setPasswordGeneratorOpen(true)}
              style={{ marginTop: 'auto' }}
            >
              生成密码
            </Button>
          </Group>
          
          <Select
            label="分类"
            placeholder="选择一个分类"
            data={[
              { value: '社交媒体', label: '社交媒体' },
              { value: '金融', label: '金融' },
              { value: '购物', label: '购物' },
              { value: '工作', label: '工作' },
              { value: '娱乐', label: '娱乐' },
              { value: '其他', label: '其他' },
            ]}
            mb="xl"
          />
          
          <Group position="right">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>取消</Button>
            <Button type="submit">保存</Button>
          </Group>
        </Box>
      </Modal>
      
      {/* 编辑密码模态框 */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="编辑密码"
        size="md"
      >
        {currentPassword && (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleEditPassword(); }}>
            <TextInput
              label="网站名称"
              defaultValue={currentPassword.website}
              required
              mb="md"
            />
            
            <TextInput
              label="网站URL"
              defaultValue={currentPassword.url}
              mb="md"
            />
            
            <TextInput
              label="用户名/邮箱"
              defaultValue={currentPassword.username}
              required
              mb="md"
            />
            
            <Group mb="md" grow>
              <PasswordInput
                label="密码"
                defaultValue={currentPassword.password}
                required
              />
              <Button 
                variant="light" 
                onClick={() => setPasswordGeneratorOpen(true)}
                style={{ marginTop: 'auto' }}
              >
                生成密码
              </Button>
            </Group>
            
            <Select
              label="分类"
              defaultValue={currentPassword.category}
              data={[
                { value: '社交媒体', label: '社交媒体' },
                { value: '金融', label: '金融' },
                { value: '购物', label: '购物' },
                { value: '工作', label: '工作' },
                { value: '娱乐', label: '娱乐' },
                { value: '其他', label: '其他' },
              ]}
              mb="xl"
            />
            
            <Group position="right">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>取消</Button>
              <Button type="submit">保存更改</Button>
            </Group>
          </Box>
        )}
      </Modal>
      
      {/* 密码生成器模态框 */}
      <Modal
        opened={passwordGeneratorOpen}
        onClose={() => setPasswordGeneratorOpen(false)}
        title="密码生成器"
        size="md"
      >
        <Box>
          <Group mb="md">
            <TextInput
              label="生成的密码"
              value={generatedPassword}
              readOnly
              style={{ flex: 1 }}
              type={showGeneratedPassword ? "text" : "password"}
              rightSection={
                <ActionIcon onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}>
                  {showGeneratedPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </ActionIcon>
              }
            />
            <ActionIcon 
              size="lg" 
              onClick={() => copyToClipboard(generatedPassword)}
              style={{ marginTop: 'auto' }}
            >
              <Copy size={16} />
            </ActionIcon>
            <ActionIcon 
              size="lg" 
              onClick={handleGeneratePassword}
              style={{ marginTop: 'auto' }}
            >
              <RefreshCw size={16} />
            </ActionIcon>
          </Group>
          
          <Text size="sm" mb="xs">密码长度: {passwordLength}</Text>
          <Group mb="md" position="apart">
            <Text size="xs" color="dimmed">8</Text>
            <Text size="xs" color="dimmed">32</Text>
          </Group>
          <Progress 
            value={(passwordLength - 8) / 24 * 100} 
            mb="md"
            label={passwordLength.toString()}
            size="xl"
            radius="xl"
          />
          <input
            type="range"
            min={8}
            max={32}
            value={passwordLength}
            onChange={(e) => setPasswordLength(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          
          <Divider my="md" />
          
          <Text size="sm" weight={500} mb="md">密码选项</Text>
          
          <Group mb="md">
            <Switch 
              label="包含大写字母 (A-Z)" 
              checked={includeUpper}
              onChange={(e) => setIncludeUpper(e.currentTarget.checked)}
            />
          </Group>
          
          <Group mb="md">
            <Switch 
              label="包含小写字母 (a-z)" 
              checked={includeLower}
              onChange={(e) => setIncludeLower(e.currentTarget.checked)}
            />
          </Group>
          
          <Group mb="md">
            <Switch 
              label="包含数字 (0-9)" 
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.currentTarget.checked)}
            />
          </Group>
          
          <Group mb="md">
            <Switch 
              label="包含特殊符号 (!@#$%...)" 
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.currentTarget.checked)}
            />
          </Group>
          
          <Group position="right" mt="xl">
            <Button variant="outline" onClick={() => setPasswordGeneratorOpen(false)}>取消</Button>
            <Button 
              onClick={() => {
                copyToClipboard(generatedPassword);
                setPasswordGeneratorOpen(false);
              }}
            >
              使用此密码
            </Button>
          </Group>
        </Box>
      </Modal>
      
      {/* 导入/导出模态框 */}
      <Modal
        opened={importExportModalOpen}
        onClose={() => setImportExportModalOpen(false)}
        title="导入/导出密码"
        size="md"
      >
        <Box>
          <Title order={5} mb="md">导入密码</Title>
          <Text size="sm" color="dimmed" mb="md">
            从其他密码管理器或CSV文件导入您的密码。支持导入来自Chrome、Firefox、LastPass、1Password等的密码数据。
          </Text>
          
          <Button 
            leftIcon={<Upload size={16} />}
            fullWidth
            variant="outline"
            mb="xl"
            onClick={handleImportPasswords}
          >
            导入密码
          </Button>
          
          <Divider my="md" />
          
          <Title order={5} mb="md">导出密码</Title>
          <Text size="sm" color="dimmed" mb="md">
            将您的密码导出为加密文件或CSV格式。请注意，CSV格式的导出文件不会被加密，应妥善保管。
          </Text>
          
          <Button 
            leftIcon={<Download size={16} />}
            fullWidth
            onClick={handleExportPasswords}
          >
            导出密码
          </Button>
        </Box>
      </Modal>
    </Container>
  );
};

export default Dashboard;