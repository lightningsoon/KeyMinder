from flask import Flask, jsonify
from config import Config
from extensions import db, jwt, cors
from routes import register_blueprints
import logging

# 日志配置（可选，保留原有过滤器/格式化器）
logging.basicConfig(level=logging.INFO)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": [
                "http://frontend:8010",
                "http://localhost:8010",
                "http://0.0.0.0:8010",
                "http://47.121.24.132:8010"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    register_blueprints(app)

    @app.route('/health', methods=['GET'])
    def health_check():
        from datetime import datetime
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.utcnow().isoformat()
        })

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=8009, debug=True) 