import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  Group,
  Title,
  Text,
  Alert,
  Container,
  Paper,
  Box
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuth } from '../contexts/AuthContext';
import { Lock } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: ''
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : '请输入有效的电子邮箱'),
      password: (value) => (value.length >= 6 ? null : '密码至少需要6个字符')
    }
  });

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      setError(null);
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.message || '登录失败，请检查您的凭据');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" my={40}>
      <Paper radius="md" p="xl" withBorder shadow="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Lock size={32} color="#228be6" />
        </Box>
        
        <Title order={2} mb="sm" align="center" color="blue.7">
          登录到“记着”
        </Title>
        
        <Text color="dimmed" size="sm" align="center" mb="lg">
          “记着”是您的私人密码管家，一个主密码，记住所有密码
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
          
          <PasswordInput
            required
            mt="md"
            label="主密码"
            placeholder="您的主密码"
            {...form.getInputProps('password')}
            description="这是您唯一需要记住的密码"
          />
          
          <Group position="apart" mt="xl">
            <Text size="sm">
              还没有账号？{' '}
              <Link to="/register" style={{ textDecoration: 'none', color: '#228be6' }}>
                立即注册
              </Link>
            </Text>
            <Button type="submit" loading={loading} color="blue">
              安全登录
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;