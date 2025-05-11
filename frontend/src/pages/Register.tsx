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
import { UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
      confirmPassword: ''
    },
    validate: {
      username: (value) => (value.length >= 3 ? null : '用户名至少需要3个字符'),
      password: (value) => (value.length >= 6 ? null : '密码至少需要6个字符'),
      confirmPassword: (value, values) =>
        value === values.password ? null : '两次输入的密码不一致'
    }
  });

  const handleSubmit = async (values: { username: string; password: string; confirmPassword: string }) => {
    try {
      setLoading(true);
      setError(null);
      await register(values.username, values.password);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" my={40}>
      <Paper radius="md" p="xl" withBorder shadow="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <UserPlus size={32} color="#228be6" />
        </Box>
        
        <Title order={2} mb="sm" align="center" color="blue.7">
          注册"记着"
        </Title>
        
        <Text color="dimmed" size="sm" align="center" mb="lg">
          创建一个账号，开始管理您的密码
        </Text>
        
        {error && (
          <Alert color="red" mb="md">
            {error}
          </Alert>
        )}
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            required
            label="用户名"
            placeholder="您的用户名"
            {...form.getInputProps('username')}
          />
          
          <PasswordInput
            required
            mt="md"
            label="主密码"
            placeholder="您的主密码"
            {...form.getInputProps('password')}
            description="这是您唯一需要记住的密码"
          />
          
          <PasswordInput
            required
            mt="md"
            label="确认密码"
            placeholder="再次输入您的主密码"
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
              注册账号
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;