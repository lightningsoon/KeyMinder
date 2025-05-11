import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
prisma.$connect()
  .then(() => console.log('成功连接到数据库'))
  .catch(e => console.error('数据库连接失败:', e));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 注册新用户
router.post('/register', async (req, res) => {
  try {
    console.log('收到注册请求:', { username: req.body.username });
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      console.log('注册失败: 缺少必要字段');
      return res.status(400).json({ message: '用户名和密码都是必填的' });
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUserByUsername) {
      console.log('注册失败: 用户名已存在');
      return res.status(400).json({ message: '该用户名已被使用，请选择其他用户名' });
    }

    // 生成盐和密码哈希
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 创建新用户
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        salt
      }
    });

    console.log('用户创建成功:', { id: newUser.id, username: newUser.username });

    // 创建 JWT
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: '用户注册成功',
      token,
      user: {
        id: newUser.id,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    // 添加更详细的错误信息
    if (error instanceof Error) {
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码都是必填的' });
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(400).json({ message: '用户名或密码不正确' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码不正确' });
    }

    // 创建 JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: '令牌无效或已过期' });
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      res.json({
        user
      });
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
