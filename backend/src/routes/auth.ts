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
    const { email, username, password } = req.body;

    // 验证输入
    if (!email || !username || !password) {
      return res.status(400).json({ message: '所有字段都是必填的' });
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUserByEmail) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUserByUsername) {
      return res.status(400).json({ message: '该用户名已被使用' });
    }

    // 生成盐和密码哈希
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 创建新用户
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        salt
      }
    });

    // 创建 JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: '用户注册成功',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ message: '所有字段都是必填的' });
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: '无效的凭据' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: '无效的凭据' });
    }

    // 创建 JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
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
          email: true,
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
