"""
人参识别系统数据库初始化脚本
包含数据库创建、表结构创建和Mock数据插入
"""

import mysql.connector
from mysql.connector import Error
import json
from datetime import datetime, timedelta
import random

# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',  # 请修改为您的MySQL密码
    'database': 'ginseng_system',
    'charset': 'utf8mb4'
}

# 创建数据库连接
def create_connection():
    """创建数据库连接"""
    try:
        # 首先连接到MySQL服务器（不指定数据库）
        connection = mysql.connector.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            charset=DB_CONFIG['charset']
        )
        return connection
    except Error as e:
        print(f"连接MySQL服务器失败: {e}")
        return None

def create_database():
    """创建数据库"""
    connection = create_connection()
    if connection:
        try:
            cursor = connection.cursor()
            
            # 创建数据库
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"数据库 {DB_CONFIG['database']} 创建成功")
            
            # 选择数据库
            cursor.execute(f"USE {DB_CONFIG['database']}")
            
            return connection, cursor
        except Error as e:
            print(f"创建数据库失败: {e}")
            return None, None
    return None, None

def create_tables(cursor):
    """创建所有数据表"""
    
    # 用户表
    users_table = """
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openid VARCHAR(50) UNIQUE NOT NULL,
        nickname VARCHAR(100) NOT NULL,
        avatar_url VARCHAR(255),
        score INT DEFAULT 100,
        gender TINYINT DEFAULT 0 COMMENT '0:未知, 1:男, 2:女',
        province VARCHAR(50),
        city VARCHAR(50),
        country VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_openid (openid),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    # 人参识别记录表
    ginseng_records_table = """
    CREATE TABLE IF NOT EXISTS ginseng_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        image_url VARCHAR(255),
        image_path VARCHAR(255),
        ginseng_type VARCHAR(50),
        ginseng_age VARCHAR(50),
        confidence DECIMAL(5,2),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    # 人参知识表
    ginseng_knowledge_table = """
    CREATE TABLE IF NOT EXISTS ginseng_knowledge (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        sort_order INT DEFAULT 0,
        status TINYINT DEFAULT 1 COMMENT '0:禁用, 1:启用',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_sort_order (sort_order),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    # 帖子表
    posts_table = """
    CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        images JSON,
        likes_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        shares_count INT DEFAULT 0,
        is_top TINYINT DEFAULT 0,
        status TINYINT DEFAULT 1 COMMENT '0:删除, 1:正常, 2:审核中',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        INDEX idx_status (status),
        INDEX idx_is_top (is_top)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    # 帖子评论表
    post_comments_table = """
    CREATE TABLE IF NOT EXISTS post_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        parent_id INT DEFAULT NULL,
        content TEXT NOT NULL,
        likes_count INT DEFAULT 0,
        status TINYINT DEFAULT 1 COMMENT '0:删除, 1:正常',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE,
        INDEX idx_post_id (post_id),
        INDEX idx_user_id (user_id),
        INDEX idx_parent_id (parent_id),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    # 点赞记录表
    likes_table = """
    CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        target_type VARCHAR(20) NOT NULL COMMENT 'post/comment',
        target_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_like (user_id, target_type, target_id),
        INDEX idx_target (target_type, target_id),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    # 积分记录表
    score_records_table = """
    CREATE TABLE IF NOT EXISTS score_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(20) NOT NULL COMMENT 'register/post/comment/like',
        points INT NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    # 分享记录表
    share_records_table = """
    CREATE TABLE IF NOT EXISTS share_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        share_type VARCHAR(20) NOT NULL COMMENT 'friend/timeline/link',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_post_id (post_id),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """
    
    tables = [
        ('users', users_table),
        ('ginseng_records', ginseng_records_table),
        ('ginseng_knowledge', ginseng_knowledge_table),
        ('posts', posts_table),
        ('post_comments', post_comments_table),
        ('likes', likes_table),
        ('score_records', score_records_table),
        ('share_records', share_records_table)
    ]
    
    for table_name, table_sql in tables:
        try:
            cursor.execute(table_sql)
            print(f"表 {table_name} 创建成功")
        except Error as e:
            print(f"创建表 {table_name} 失败: {e}")

def insert_mock_data(cursor, connection):
    """插入Mock数据"""
    
    # 插入用户数据
    users_data = [
        ('user_001', '人参爱好者', 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0', 120, 1, '辽宁', '沈阳', '中国'),
        ('user_002', '新手小白', 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0', 100, 2, '吉林', '长春', '中国'),
        ('user_003', '老参客', 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0', 250, 1, '黑龙江', '哈尔滨', '中国'),
        ('user_004', '参农小李', 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0', 180, 1, '辽宁', '抚顺', '中国'),
        ('user_005', '健康达人', 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0', 140, 2, '北京', '北京', '中国')
    ]
    
    cursor.executemany("""
        INSERT INTO users (openid, nickname, avatar_url, score, gender, province, city, country)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, users_data)
    
    # 插入人参知识数据
    knowledge_data = [
        ('人参的基本认识', '人参是多年生草本植物，素有"百草之王"的美誉。人参主要分布在中国东北、朝鲜、韩国、日本、俄罗斯东部等地区。人参具有大补元气、复脉固脱、补脾益肺、生津止渴、安神益智等功效。', '基础知识', 1),
        ('人参的分类', '按生长环境分类：\n1. 野山参：在自然状态下野生的人参\n2. 移山参：把野生参幼苗移植到人工环境下栽培\n3. 园参：人工种植的人参\n4. 林下参：在森林环境下人工播种的人参\n\n按加工方法分类：\n1. 鲜参：新鲜人参\n2. 白参：鲜参经过晾晒或烘干制成\n3. 红参：鲜参经过蒸制后干燥制成', '分类知识', 2),
        ('原参与林下山参的区别', '原参（园参）：\n- 人工种植在田地里\n- 生长环境相对单一\n- 形状较规整，参须较少\n- 营养积累相对较快\n- 价格相对便宜\n\n林下山参：\n- 在自然森林环境下生长\n- 生长环境复杂多样\n- 形状不规则，参须丰富\n- 营养积累缓慢但更全面\n- 价格较高，营养价值更佳', '分类知识', 3),
        ('人参年份的判断', '判断人参年份的方法：\n1. 看芦头：年份越长，芦头越粗大\n2. 看纹理：老参表面皱纹深而密\n3. 看重量：同等大小下，年份长的更重\n4. 看参须：老参的参须更细更长\n5. 看质地：年份长的人参质地更坚硬\n\n一般来说：\n- 3-6年：嫩参，适合日常保健\n- 7-15年：中等年份，药效较好\n- 15年以上：老参，药效最佳', '鉴别知识', 4),
        ('人参的食用方法', '常见食用方法：\n1. 炖汤：与鸡肉、瘦肉等一起炖煮\n2. 泡酒：人参酒具有很好的滋补效果\n3. 泡茶：切片后用开水冲泡\n4. 研粉：打成粉末冲服或胶囊服用\n5. 直接嚼服：每次1-2克\n\n注意事项：\n- 不宜与萝卜、茶叶同服\n- 感冒发热时暂停服用\n- 孕妇、儿童应在医师指导下使用', '食用方法', 5),
        ('人参的保存方法', '鲜参保存：\n- 用湿润的沙土埋藏\n- 放入冰箱冷藏\n- 用保鲜膜包好避免失水\n\n干参保存：\n- 密封保存，防潮防虫\n- 避免阳光直射\n- 可用木盒或铁盒保存\n- 适当放入干燥剂\n\n注意：人参怕热、怕湿、怕虫蛀，保存环境要干燥阴凉。', '保存方法', 6)
    ]
    
    cursor.executemany("""
        INSERT INTO ginseng_knowledge (title, content, category, sort_order)
        VALUES (%s, %s, %s, %s)
    """, knowledge_data)
    
    # 插入帖子数据
    posts_data = [
        (1, '分享一株野山参', '在长白山发现的一株野山参，大家看看品质如何？', '[]', 15, 8, 3),
        (2, '人参泡酒的正确方法', '最近想用人参泡酒，请教一下各位大神正确的泡制方法和注意事项。', '[]', 23, 12, 5),
        (3, '林下参种植心得分享', '种植林下参三年了，分享一些经验给大家参考。', '[]', 18, 6, 2),
        (4, '如何辨别人参的真假', '市场上假人参太多，教大家几个简单的辨别方法。', '[]', 32, 15, 8),
        (5, '我的人参收藏', '收藏了十几年的人参，每一株都有故事。', '[]', 45, 20, 10)
    ]
    
    cursor.executemany("""
        INSERT INTO posts (user_id, title, content, images, likes_count, comments_count, shares_count)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, posts_data)
    
    # 插入评论数据
    comments_data = [
        (1, 1, None, '这株参看起来品质很好，芦头很粗壮！', 3),
        (1, 2, None, '参须也很丰富，应该是年份不错的野山参。', 5),
        (2, 1, 1, '同意楼上的观点，确实是好参！', 2),
        (2, 2, None, '人参泡酒要注意酒精度数，建议50度以上。', 8),
        (3, 2, None, '还要注意密封，避免氧化。', 4),
        (3, 3, None, '林下参种植确实需要经验，感谢分享！', 6),
        (4, 4, None, '这些辨别方法很实用，收藏了！', 10),
        (5, 5, None, '哇，都是好参！羡慕收藏家。', 12)
    ]
    
    cursor.executemany("""
        INSERT INTO post_comments (post_id, user_id, parent_id, content, likes_count)
        VALUES (%s, %s, %s, %s, %s)
    """, comments_data)
    
    # 插入人参识别记录
    records_data = [
        (1, '/uploads/ginseng1.jpg', 'https://example.com/ginseng1.jpg', '原参', '3-5年', 95.20, '这是一株品质优良的原参，参龄较为理想。'),
        (2, '/uploads/ginseng2.jpg', 'https://example.com/ginseng2.jpg', '林下山参', '8-12年', 87.60, '这是一株珍贵的林下山参，年份较长，营养价值很高。'),
        (3, '/uploads/ginseng3.jpg', 'https://example.com/ginseng3.jpg', '原参', '6-8年', 92.30, '品质良好的原参，适合日常保健使用。'),
        (1, '/uploads/ginseng4.jpg', 'https://example.com/ginseng4.jpg', '林下山参', '15年以上', 98.50, '非常珍贵的老林下山参，药效极佳。'),
        (4, '/uploads/ginseng5.jpg', 'https://example.com/ginseng5.jpg', '原参', '4-6年', 89.70, '中等品质的原参，性价比不错。')
    ]
    
    cursor.executemany("""
        INSERT INTO ginseng_records (user_id, image_path, image_url, ginseng_type, ginseng_age, confidence, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, records_data)
    
    # 插入积分记录
    score_records_data = [
        (1, 'register', 100, '新用户注册奖励'),
        (2, 'register', 100, '新用户注册奖励'),
        (3, 'register', 100, '新用户注册奖励'),
        (4, 'register', 100, '新用户注册奖励'),
        (5, 'register', 100, '新用户注册奖励'),
        (1, 'post', 20, '发布帖子奖励'),
        (2, 'post', 20, '发布帖子奖励'),
        (3, 'post', 20, '发布帖子奖励'),
        (3, 'post', 20, '发布帖子奖励'),
        (3, 'post', 20, '发布帖子奖励'),
        (4, 'post', 20, '发布帖子奖励'),
        (5, 'post', 20, '发布帖子奖励'),
        (5, 'post', 20, '发布帖子奖励')
    ]
    
    cursor.executemany("""
        INSERT INTO score_records (user_id, type, points, description)
        VALUES (%s, %s, %s, %s)
    """, score_records_data)
    
    connection.commit()
    print("Mock数据插入完成")

def main():
    """主函数"""
    print("开始初始化人参识别系统数据库...")
    
    # 创建数据库
    connection, cursor = create_database()
    
    if connection and cursor:
        try:
            # 创建数据表
            create_tables(cursor)
            
            # 插入Mock数据
            insert_mock_data(cursor, connection)
            
            print("数据库初始化完成！")
            
        except Error as e:
            print(f"数据库初始化失败: {e}")
            
        finally:
            # 关闭连接
            if cursor:
                cursor.close()
            if connection:
                connection.close()
            print("数据库连接已关闭")
    else:
        print("数据库初始化失败：无法建立连接")

if __name__ == "__main__":
    main()
