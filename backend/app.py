"""
人参识别系统Flask后端应用
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import json
import os
from datetime import datetime
import hashlib
import uuid
from werkzeug.utils import secure_filename
import base64
from PIL import Image
import io
import requests

app = Flask(__name__)
CORS(app)

# 配置
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

# 微信小程序配置
WECHAT_CONFIG = {
    'app_id': 'wx89180ef4401b15c0',  # 请替换为您的小程序AppID
    'app_secret': '51efb5f158e3332b5d6e61cbbb2e4967'  # 请替换为您的小程序AppSecret
}

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Dd2411923*#',  # 请修改为您的MySQL密码
    'database': 'ginseng_system',
    'charset': 'utf8mb4'
}

# 确保上传目录存在
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

def get_db_connection():
    """获取数据库连接"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"数据库连接失败: {e}")
        return None

def format_datetime_for_ios(dt):
    """格式化日期时间为iOS兼容的格式 yyyy/MM/dd HH:mm:ss"""
    if dt is None:
        return None
    return dt.strftime('%Y/%m/%d %H:%M:%S')

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def mock_ginseng_analysis(image_path):
    """模拟人参识别分析"""
    import random
    
    # 模拟分析结果
    types = ['原参', '林下山参']
    ages = ['3-5年', '6-8年', '8-12年', '12-15年', '15年以上']
    
    ginseng_type = random.choice(types)
    ginseng_age = random.choice(ages)
    confidence = round(random.uniform(80, 99), 2)
    
    descriptions = {
        '原参': [
            '这是一株品质优良的原参，参龄较为理想。',
            '品质良好的原参，适合日常保健使用。',
            '中等品质的原参，性价比不错。'
        ],
        '林下山参': [
            '这是一株珍贵的林下山参，年份较长，营养价值很高。',
            '非常珍贵的老林下山参，药效极佳。',
            '品质优秀的林下山参，值得收藏。'
        ]
    }
    
    description = random.choice(descriptions[ginseng_type])
    
    return {
        'type': ginseng_type,
        'age': ginseng_age,
        'confidence': f"{confidence}%",
        'description': description
    }

# API路由

@app.route('/api/user/login', methods=['POST'])
def user_login():
    """用户登录"""
    try:
        data = request.get_json()
        code = data.get('code')
        user_info = data.get('userInfo', {})
        
        if not code:
            return jsonify({'error': '登录code不能为空'}), 400
        
        # 调用微信API获取openid
        wx_url = f"https://api.weixin.qq.com/sns/jscode2session"
        wx_params = {
            'appid': WECHAT_CONFIG['app_id'],
            'secret': WECHAT_CONFIG['app_secret'],
            'js_code': code,
            'grant_type': 'authorization_code'
        }
        
        try:
            wx_response = requests.get(wx_url, params=wx_params)
            wx_data = wx_response.json()
            
            if 'errcode' in wx_data:
                print(f"微信登录失败: {wx_data}")
                # 开发环境使用模拟数据
                openid = f"mock_openid_{hash(code) % 10000}"
            else:
                openid = wx_data.get('openid')
                
        except Exception as e:
            print(f"调用微信API失败: {e}")
            # 开发环境使用模拟数据
            openid = f"mock_openid_{hash(code) % 10000}"
        
        if not openid:
            return jsonify({'error': '获取用户信息失败'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # 查询用户是否存在
        cursor.execute("SELECT * FROM users WHERE openid = %s", (openid,))
        user = cursor.fetchone()
        
        if not user:
            # 新用户注册
            cursor.execute("""
                INSERT INTO users (openid, nickname, avatar_url, gender, province, city, country)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                openid,
                user_info.get('nickName', ''),
                user_info.get('avatarUrl', ''),
                user_info.get('gender', 0),
                user_info.get('province', ''),
                user_info.get('city', ''),
                user_info.get('country', '')
            ))
            
            user_id = cursor.lastrowid
            
            # 记录注册积分
            cursor.execute("""
                INSERT INTO score_records (user_id, type, points, description)
                VALUES (%s, 'register', 100, '新用户注册奖励')
            """, (user_id,))
            
            connection.commit()
            
            # 获取新用户信息
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'openid': user['openid'],
                'nickname': user['nickname'],
                'avatar_url': user['avatar_url'],
                'score': user['score']
            }
        })
        
    except Exception as e:
        print(f"登录失败: {e}")
        return jsonify({'error': '登录失败'}), 500

@app.route('/api/ginseng/analyze', methods=['POST'])
def analyze_ginseng():
    """人参识别分析"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '没有上传图片'}), 400
        
        file = request.files['image']
        user_id = request.form.get('user_id')
        
        if not user_id:
            return jsonify({'error': '用户ID不能为空'}), 400
        
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if file and allowed_file(file.filename):
            # 生成唯一文件名
            filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # 模拟分析
            analysis_result = mock_ginseng_analysis(file_path)
            
            # 保存分析记录
            connection = get_db_connection()
            if connection:
                cursor = connection.cursor()
                
                cursor.execute("""
                    INSERT INTO ginseng_records (user_id, image_path, image_url, ginseng_type, ginseng_age, confidence, description)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id,
                    file_path,
                    f"/uploads/{filename}",
                    analysis_result['type'],
                    analysis_result['age'],
                    float(analysis_result['confidence'].replace('%', '')),
                    analysis_result['description']
                ))
                
                connection.commit()
                cursor.close()
                connection.close()
            
            return jsonify({
                'success': True,
                'result': analysis_result,
                'image_url': f"/uploads/{filename}"
            })
        
        return jsonify({'error': '不支持的文件格式'}), 400
        
    except Exception as e:
        print(f"分析失败: {e}")
        return jsonify({'error': '分析失败'}), 500

@app.route('/api/knowledge', methods=['GET'])
def get_knowledge():
    """获取人参知识"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM ginseng_knowledge 
            WHERE status = 1 
            ORDER BY sort_order ASC
        """)
        
        knowledge_list = cursor.fetchall()
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'data': knowledge_list
        })
        
    except Exception as e:
        print(f"获取知识失败: {e}")
        return jsonify({'error': '获取知识失败'}), 500

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """获取帖子列表"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # 获取帖子列表
        cursor.execute("""
            SELECT p.*, u.nickname as author_nickname, u.avatar_url as author_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.status = 1
            ORDER BY p.is_top DESC, p.created_at DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))
        
        posts = cursor.fetchall()
        
        # 获取总数
        cursor.execute("SELECT COUNT(*) as total FROM posts WHERE status = 1")
        total = cursor.fetchone()['total']
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'data': posts,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        print(f"获取帖子失败: {e}")
        return jsonify({'error': '获取帖子失败'}), 500

@app.route('/api/user/posts', methods=['GET'])
def get_current_user_posts():
    """获取当前用户的帖子列表"""
    try:
        # 从请求头或参数中获取用户ID（简化版本，实际应该从JWT token中获取）
        user_id = request.headers.get('user-id') or request.args.get('user_id')
        
        if not user_id:
            # 如果没有用户ID，尝试从模拟的session中获取
            # 这里简化处理，实际应该从真实的用户认证中获取
            return jsonify({'error': '用户未登录'}), 401
        
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            # 如果转换失败，使用默认用户ID (开发阶段)
            user_id = 1
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # 获取用户帖子列表
        cursor.execute("""
            SELECT p.*, u.nickname as author_nickname, u.avatar_url as author_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = %s AND p.status = 1
            ORDER BY p.created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, limit, offset))
        
        posts = cursor.fetchall()
        
        # 格式化时间为iOS兼容格式
        for post in posts:
            if 'created_at' in post and post['created_at']:
                post['created_at'] = format_datetime_for_ios(post['created_at'])
        
        # 获取总数
        cursor.execute("SELECT COUNT(*) as total FROM posts WHERE user_id = %s AND status = 1", (user_id,))
        total = cursor.fetchone()['total']
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'data': posts,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        print(f"获取当前用户帖子失败: {e}")
        return jsonify({'error': '获取用户帖子失败'}), 500

@app.route('/api/users/<int:user_id>/posts', methods=['GET'])
def get_user_posts(user_id):
    """获取用户的帖子列表"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # 获取用户帖子列表
        cursor.execute("""
            SELECT p.*, u.nickname as author_nickname, u.avatar_url as author_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = %s AND p.status = 1
            ORDER BY p.created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, limit, offset))
        
        posts = cursor.fetchall()
        
        # 获取总数
        cursor.execute("SELECT COUNT(*) as total FROM posts WHERE user_id = %s AND status = 1", (user_id,))
        total = cursor.fetchone()['total']
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'data': posts,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        print(f"获取用户帖子失败: {e}")
        return jsonify({'error': '获取用户帖子失败'}), 500

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    """删除帖子（软删除）"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': '缺少用户ID'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor()
        
        # 验证帖子是否属于该用户
        cursor.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cursor.fetchone()
        
        if not post:
            return jsonify({'error': '帖子不存在'}), 404
        
        if post[0] != user_id:
            return jsonify({'error': '无权删除此帖子'}), 403
        
        # 软删除帖子（设置status为0）
        cursor.execute("UPDATE posts SET status = 0 WHERE id = %s", (post_id,))
        connection.commit()
        
        cursor.close()
        connection.close()
        
        return jsonify({'success': True, 'message': '帖子删除成功'})
        
    except Exception as e:
        print(f"删除帖子失败: {e}")
        return jsonify({'error': '删除帖子失败'}), 500

@app.route('/api/posts', methods=['POST'])
def create_post():
    """创建帖子"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        title = data.get('title')
        content = data.get('content')
        images = data.get('images', [])
        
        if not all([user_id, title, content]):
            return jsonify({'error': '参数不完整'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor()
        
        # 插入帖子
        cursor.execute("""
            INSERT INTO posts (user_id, title, content, images)
            VALUES (%s, %s, %s, %s)
        """, (user_id, title, content, json.dumps(images)))
        
        post_id = cursor.lastrowid
        
        # 增加用户积分
        cursor.execute("""
            UPDATE users SET score = score + 20 WHERE id = %s
        """, (user_id,))
        
        # 记录积分变动
        cursor.execute("""
            INSERT INTO score_records (user_id, type, points, description)
            VALUES (%s, 'post', 20, '发布帖子奖励')
        """, (user_id,))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'post_id': post_id,
            'message': '发布成功，获得20积分'
        })
        
    except Exception as e:
        print(f"创建帖子失败: {e}")
        return jsonify({'error': '创建帖子失败'}), 500

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post_detail(post_id):
    """获取帖子详情"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # 获取帖子详情
        cursor.execute("""
            SELECT p.*, u.nickname as author_nickname, u.avatar_url as author_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = %s AND p.status = 1
        """, (post_id,))
        
        post = cursor.fetchone()
        
        if not post:
            return jsonify({'error': '帖子不存在'}), 404
        
        # 获取评论
        cursor.execute("""
            SELECT c.*, u.nickname as author_nickname, u.avatar_url as author_avatar
            FROM post_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = %s AND c.status = 1
            ORDER BY c.created_at ASC
        """, (post_id,))
        
        comments = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'post': post,
            'comments': comments
        })
        
    except Exception as e:
        print(f"获取帖子详情失败: {e}")
        return jsonify({'error': '获取帖子详情失败'}), 500

@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_post_comments(post_id):
    """获取帖子的评论列表"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor(dictionary=True)
        
        # 获取评论列表
        cursor.execute("""
            SELECT c.*, u.nickname as user_nickname, u.avatar_url as user_avatar
            FROM post_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = %s AND c.status = 1
            ORDER BY c.created_at ASC
        """, (post_id,))
        
        comments = cursor.fetchall()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'data': comments
        })
        
    except Exception as e:
        print(f"获取评论失败: {e}")
        return jsonify({'error': '获取评论失败'}), 500

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def create_comment(post_id):
    """创建评论"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        content = data.get('content')
        parent_id = data.get('parent_id')
        
        if not all([user_id, content]):
            return jsonify({'error': '参数不完整'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor()
        
        # 插入评论
        cursor.execute("""
            INSERT INTO post_comments (post_id, user_id, parent_id, content)
            VALUES (%s, %s, %s, %s)
        """, (post_id, user_id, parent_id, content))
        
        # 更新帖子评论数
        cursor.execute("""
            UPDATE posts SET comments_count = comments_count + 1 WHERE id = %s
        """, (post_id,))
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'message': '评论成功'
        })
        
    except Exception as e:
        print(f"创建评论失败: {e}")
        return jsonify({'error': '创建评论失败'}), 500

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    """点赞帖子"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': '用户ID不能为空'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor()
        
        # 检查是否已点赞
        cursor.execute("""
            SELECT * FROM likes WHERE user_id = %s AND target_type = 'post' AND target_id = %s
        """, (user_id, post_id))
        
        existing_like = cursor.fetchone()
        
        if existing_like:
            # 取消点赞
            cursor.execute("""
                DELETE FROM likes WHERE user_id = %s AND target_type = 'post' AND target_id = %s
            """, (user_id, post_id))
            
            cursor.execute("""
                UPDATE posts SET likes_count = likes_count - 1 WHERE id = %s
            """, (post_id,))
            
            message = '取消点赞'
            liked = False
        else:
            # 点赞
            cursor.execute("""
                INSERT INTO likes (user_id, target_type, target_id)
                VALUES (%s, 'post', %s)
            """, (user_id, post_id))
            
            cursor.execute("""
                UPDATE posts SET likes_count = likes_count + 1 WHERE id = %s
            """, (post_id,))
            
            message = '点赞成功'
            liked = True
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'message': message,
            'liked': liked
        })
        
    except Exception as e:
        print(f"点赞失败: {e}")
        return jsonify({'error': '点赞失败'}), 500

@app.route('/api/upload/image', methods=['POST'])
def upload_image():
    """上传图片"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '没有上传文件'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if file and allowed_file(file.filename):
            # 生成安全的文件名
            filename = secure_filename(file.filename)
            # 添加时间戳防止重名
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
            filename = timestamp + filename
            
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # 返回文件URL
            file_url = f"/uploads/{filename}"
            
            return jsonify({
                'success': True,
                'url': file_url,
                'filename': filename
            })
        else:
            return jsonify({'error': '不支持的文件类型'}), 400
            
    except Exception as e:
        print(f"上传失败: {e}")
        return jsonify({'error': '上传失败'}), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """获取上传的文件"""
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))

@app.route('/api/user/<int:user_id>/score', methods=['GET'])
def get_user_score(user_id):
    """获取用户积分"""
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': '数据库连接失败'}), 500
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT score FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': '用户不存在'}), 404
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'score': user['score']
        })
        
    except Exception as e:
        print(f"获取用户积分失败: {e}")
        return jsonify({'error': '获取用户积分失败'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
