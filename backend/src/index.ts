import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import passwordRoutes from './routes/passwords';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = 8009;

// 更详细的 CORS 配置
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://frontend:8010',
      'http://localhost:8010',
      'http://0.0.0.0:8010',
      'http://47.121.24.132:8010',
    ];

    // 记录请求来源，便于调试
    console.log(`收到请求，源: ${origin || '未知'}`);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS 阻止了来自 ${origin} 的请求`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

// 应用 CORS 中间件
app.use(cors(corsOptions));
app.use(express.json());

// 添加测试路由，用于验证 CORS 配置
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS 配置正常工作!' });
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/passwords', authenticateToken, passwordRoutes);

// 添加根路由重定向
app.get('/', (req, res) => {
  res.json({ message: '密码管理器 API 运行正常' });
});

// 添加健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 修改监听方式，确保监听所有网络接口
app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
  console.log('允许的跨域来源:');
  corsOptions.origin(null, (err, allowed) => {
    if (allowed) {
      console.log('- 无源请求 (如移动应用)');
    }
  });
  ['http://frontend:8010', 'http://localhost:8010', 'http://0.0.0.0:8010', 'http://47.121.24.132:8010'].forEach(
    (origin) => {
      corsOptions.origin(origin, (err, allowed) => {
        if (allowed) {
          console.log(`- ${origin}`);
        }
      });
    }
  );
});
