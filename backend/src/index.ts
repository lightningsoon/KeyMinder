import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import passwordRoutes from './routes/passwords';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = 8009;

// 中间件
app.use(express.json());
app.use(cors({
  origin: ['http://frontend:8010','http://localhost:8010', 'http://8.147.108.7:8010', 'http://0.0.0.0:8010'],
  credentials: true
}));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/passwords', authenticateToken, passwordRoutes);

app.get('/', (req, res) => {
  res.json({ message: '密码管理器 API 运行正常' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
