import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// 加密密码
const encryptPassword = (password: string, secretKey: string): string => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// 解密密码
const decryptPassword = (encryptedPassword: string, secretKey: string): string => {
  const algorithm = 'aes-256-cbc';
  const [ivHex, encryptedHex] = encryptedPassword.split(':');
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// 获取所有密码条目
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const passwordItems = await prisma.passwordItem.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    // 这里我们不解密密码，只在客户端请求特定密码时解密
    res.json({ passwordItems });
  } catch (error) {
    console.error('获取密码条目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个密码条目
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    const passwordItem = await prisma.passwordItem.findFirst({
      where: { id, userId }
    });

    if (!passwordItem) {
      return res.status(404).json({ message: '密码条目不存在' });
    }

    // 解密密码
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || userId; // 使用用户ID作为加密密钥
    const decryptedItem = {
      ...passwordItem,
      password: decryptPassword(passwordItem.password, ENCRYPTION_KEY)
    };

    res.json({ passwordItem: decryptedItem });
  } catch (error) {
    console.error('获取密码条目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新密码条目
router.post('/', async (req, res) => {
  try {
    const { title, username, password, url, notes, category, tags } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 验证必填字段
    if (!title || !username || !password) {
      return res.status(400).json({ message: '标题、用户名和密码是必填的' });
    }

    // 加密密码
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || userId; // 使用用户ID作为加密密钥
    const encryptedPassword = encryptPassword(password, ENCRYPTION_KEY);

    const newPasswordItem = await prisma.passwordItem.create({
      data: {
        title,
        username,
        password: encryptedPassword,
        url,
        notes,
        category,
        tags,
        userId
      }
    });

    res.status(201).json({
      message: '密码条目创建成功',
      passwordItem: {
        ...newPasswordItem,
        password: '******' // 不返回解密后的密码
      }
    });
  } catch (error) {
    console.error('创建密码条目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新密码条目
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, username, password, url, notes, category, tags } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查密码条目是否存在
    const existingItem = await prisma.passwordItem.findFirst({
      where: { id, userId }
    });

    if (!existingItem) {
      return res.status(404).json({ message: '密码条目不存在' });
    }

    // 准备更新数据
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (username !== undefined) updateData.username = username;
    if (url !== undefined) updateData.url = url;
    if (notes !== undefined) updateData.notes = notes;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    
    // 如果提供了新密码，则加密
    if (password !== undefined) {
      const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || userId;
      updateData.password = encryptPassword(password, ENCRYPTION_KEY);
    }

    // 更新密码条目
    const updatedPasswordItem = await prisma.passwordItem.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: '密码条目更新成功',
      passwordItem: {
        ...updatedPasswordItem,
        password: '******' // 不返回解密后的密码
      }
    });
  } catch (error) {
    console.error('更新密码条目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除密码条目
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查密码条目是否存在
    const existingItem = await prisma.passwordItem.findFirst({
      where: { id, userId }
    });

    if (!existingItem) {
      return res.status(404).json({ message: '密码条目不存在' });
    }

    // 删除密码条目
    await prisma.passwordItem.delete({
      where: { id }
    });

    res.json({ message: '密码条目删除成功' });
  } catch (error) {
    console.error('删除密码条目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 生成随机密码
router.get('/generate/password', (req, res) => {
  try {
    const length = parseInt(req.query.length as string) || 12;
    const includeUppercase = req.query.includeUppercase === 'true';
    const includeLowercase = req.query.includeLowercase !== 'false';
    const includeNumbers = req.query.includeNumbers !== 'false';
    const includeSymbols = req.query.includeSymbols === 'true';

    let chars = '';
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (chars.length === 0) {
      chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }

    res.json({ password });
  } catch (error) {
    console.error('生成密码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
