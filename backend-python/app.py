from flask import Flask, jsonify
from config import Config
from extensions import db, jwt, cors
from routes import register_blueprints
import logging
import os

# 日志配置
logging.basicConfig(level=logging.DEBUG)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    jwt.init_app(app)
    
    # 获取允许的域名列表
    allowed_origins = [
        "http://frontend:8010",        # Docker 网络
        "http://localhost:8010",       # 本地开发
        "http://0.0.0.0:8010",         # 所有接口
        "http://47.121.24.132:8010",   # 生产环境
        "http://47.121.24.132",        # 生产环境（不带端口）
        "http://password-manager-frontend:8010",  # Docker 容器名
        "http://password-manager-frontend",       # Docker 容器名（不带端口）
    ]
    
    # 如果配置了额外的域名，也添加到允许列表
    if os.getenv('ADDITIONAL_ALLOWED_ORIGINS'):
        allowed_origins.extend(os.getenv('ADDITIONAL_ALLOWED_ORIGINS').split(','))
    
    # 在开发模式下允许所有来源
    if os.getenv('FLASK_ENV') == 'development':
        allowed_origins = ['*']
    
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # 注册蓝图
    register_blueprints(app)

    @app.route('/health', methods=['GET'])
    def health_check():
        from datetime import datetime
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.utcnow().isoformat()
        })

    # 确保数据库表存在
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=8009, debug=True) 