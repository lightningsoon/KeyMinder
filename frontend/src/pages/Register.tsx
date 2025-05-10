import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Group,
  Box,
  Title,
  Text,
  Alert,
  Container,
  Paper,
  Progress
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Shield } from 'lucide-react';

// 密码强度检测函数
function PasswordRequirement({ meets, label }: { meets: boolean; label: string }) {
  return (
    <Text
      color={meets ? 'teal' : 'red'}
      sx={{ display: 'flex', alignItems: 'center' }}
      mt={5}
      size="sm"
    >
      {meets ? '✓' : '✗'} {label}
    </Text>
  );
}

function getStrength(password: string) {
  let score = 0;
  if (!password) return score;

  // 有大写字母加分
  if (/[A-Z]/.test(password)) score += 1;
  // 有小写字母加分
  if (/[a-z]/.test(password)) score += 1;
  // 有数字加分
  if (/[0-9]/.test(password)) score += 1;
  // 有特殊字符加分
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  // 长度超过8加分
  if (password.length > 8) score += 1;

  return score;
}

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : '请输入有效的电子邮箱'),
      username: (value) => (value.length >= 3 ? null : '用户名至少需要3个字符'),
      password: (value) => (value.length >= 6 ? null : '密码至少需要6个字符'),
      confirmPassword: (value, values) =>
        value === values.password ? null : '密码不匹配'
    }
  });

  const handleSubmit = async (values: { email: string; username: string; password: string; confirmPassword: string }) => {
    try {
      setLoading(true);
      setError(null);
      await register(values.email, values.username, values.password);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || '注册失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const password = form.values.password;
  const strength = getStrength(password);
  const color = strength === 0 ? 'red' : strength < 3 ? 'orange' : strength < 5 ? 'yellow' : 'green';

  const requirements = [
    { label: '至少包含6个字符', meets: password.length >= 6 },
    { label: '包含至少一个大写字母', meets: /[A-Z]/.test(password) },
    { label: '包含至少一个数字', meets: /[0-9]/.test(password) },
    { label: '包含至少一个特殊字符', meets: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <Container size="xs" my={40}>
      <Paper radius="md" p="xl" withBorder shadow="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Shield size={32} color="#228be6" />
        </Box>
        
        <Title order={2} mb="sm" align="center" color="blue.7">
          注册记着
        </Title>
        
        <Text color="dimmed" size="sm" align="center" mb="lg">
          创建您的密码保险箱，一个主密码，安全管理所有密码
        </Text>
        
        {error && (
          <Alert color="red" mb="md">
            {error}
          </Alert>
        )}
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            required
            label="电子邮箱"
            placeholder="your@email.com"
            {...form.getInputProps('email')}
          />
          
          <TextInput
            required
            mt="md"
            label="用户名"
            placeholder="您的用户名"
            {...form.getInputProps('username')}
          />
          
          <PasswordInput
            required
            mt="md"
            label="主密码"
            placeholder="创建一个强密码"
            description="这是您唯一需要记住的密码，请确保它足够安全"
            {...form.getInputProps('password')}
          />
          
          {password.length > 0 && (
            <Box mt="sm">
              <Progress value={(strength / 5) * 100} color={color} size="xs" />
              <Text size="xs" color="dimmed" mt="xs">密码强度: {strength < 3 ? '弱' : strength < 5 ? '中等' : '强'}</Text>
              
              <Box mt="sm">
                {requirements.map((requirement, index) => (
                  <PasswordRequirement key={index} {...requirement} />
                ))}
              </Box>
            </Box>
          )}
          
          <PasswordInput
            required
            mt="md"
            label="确认主密码"
            placeholder="再次输入主密码"
            {...form.getInputProps('confirmPassword')}
          />
          
          <Group position="apart" mt="xl">
            <Text size="sm">
              已有账号？{' '}
              <Link to="/login" style={{ textDecoration: 'none', color: '#228be6' }}>
                立即登录
              </Link>
            </Text>
            <Button type="submit" loading={loading} color="blue">
              创建账号
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;