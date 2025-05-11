import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();

// 注册验证规则
export const registerValidation = [
  body('email').isEmail().withMessage('请提供有效的电子邮件地址'),
  body('password').isLength({ min: 8 }).withMessage('密码长度至少为8个字符'),
];

// 登录验证规则
export const loginValidation = [
  body('email').isEmail().withMessage('请提供有效的电子邮件地址'),
  body('password').notEmpty().withMessage('请提供密码'),
];

// 注册新用户
export const register = async (req: Request, res: Response) => {
  // 验证请求
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: '该电子邮件已被注册' });
    }

    // 哈希密码
    const { hashedPassword, salt } = await hashPassword(password);

    // 创建新用户
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        salt,
      },
    });

    // 生成JWT令牌
    const token = generateToken(user.id);

    // 返回用户信息和令牌
    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 用户登录
export const login = async (req: Request, res: Response) => {
  // 验证请求
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: '电子邮件或密码不正确' });
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '电子邮件或密码不正确' });
    }

    // 生成JWT令牌
    const token = generateToken(user.id);

    // 返回用户信息和令牌
    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取当前用户信息
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};
