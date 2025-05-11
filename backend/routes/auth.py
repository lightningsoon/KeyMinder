from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User
import bcrypt
import uuid

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def generate_salt():
    return bcrypt.gensalt().decode('utf-8')

def hash_password(password, salt):
    return bcrypt.hashpw(password.encode('utf-8'), salt.encode('utf-8')).decode('utf-8')

def verify_password(password, hashed_password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': '用户名和密码都是必填的'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'message': '该用户名已被使用'}), 400

        salt = generate_salt()
        password_hash = hash_password(password, salt)
        new_user = User(
            id=str(uuid.uuid4()),
            username=username,
            password_hash=password_hash,
            salt=salt
        )
        db.session.add(new_user)
        db.session.commit()
        access_token = create_access_token(identity=new_user.id)
        return jsonify({
            'message': '注册成功',
            'token': access_token,
            'user': {
                'id': new_user.id,
                'username': new_user.username
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': '服务器错误'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return jsonify({'message': '用户名和密码都是必填的'}), 400
        user = User.query.filter_by(username=username).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({'message': '用户名或密码不正确'}), 401
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'message': '登录成功',
            'token': access_token,
            'user': {
                'id': user.id,
                'username': user.username
            }
        })
    except Exception as e:
        return jsonify({'message': '服务器错误'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'message': '用户不存在'}), 404
        return jsonify({
            'user': {
                'id': user.id,
                'username': user.username,
                'created_at': user.created_at.isoformat(),
                'updated_at': user.updated_at.isoformat()
            }
        })
    except Exception as e:
        return jsonify({'message': '服务器错误'}), 500 