# 人参识别系统数据库设计

## 数据库架构

### 1. 用户表 (users)
- id (INT, PRIMARY KEY, AUTO_INCREMENT) - 用户ID
- openid (VARCHAR(50), UNIQUE) - 微信OpenID
- nickname (VARCHAR(100)) - 用户昵称
- avatar_url (VARCHAR(255)) - 头像URL
- score (INT, DEFAULT 100) - 用户积分
- gender (TINYINT) - 性别 (0:未知, 1:男, 2:女)
- province (VARCHAR(50)) - 省份
- city (VARCHAR(50)) - 城市
- country (VARCHAR(50)) - 国家
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) - 更新时间

### 2. 人参识别记录表 (ginseng_records)
- id (INT, PRIMARY KEY, AUTO_INCREMENT) - 记录ID
- user_id (INT, FOREIGN KEY) - 用户ID
- image_url (VARCHAR(255)) - 图片URL
- image_path (VARCHAR(255)) - 图片本地路径
- ginseng_type (VARCHAR(50)) - 人参类型 (原参/林下山参)
- ginseng_age (VARCHAR(50)) - 人参年龄
- confidence (DECIMAL(5,2)) - 识别置信度
- description (TEXT) - 识别描述
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间

### 3. 人参知识表 (ginseng_knowledge)
- id (INT, PRIMARY KEY, AUTO_INCREMENT) - 知识ID
- title (VARCHAR(200)) - 知识标题
- content (TEXT) - 知识内容
- category (VARCHAR(50)) - 分类
- sort_order (INT, DEFAULT 0) - 排序
- status (TINYINT, DEFAULT 1) - 状态 (0:禁用, 1:启用)
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) - 更新时间

### 4. 帖子表 (posts)
- id (INT, PRIMARY KEY, AUTO_INCREMENT) - 帖子ID
- user_id (INT, FOREIGN KEY) - 用户ID
- title (VARCHAR(200)) - 帖子标题
- content (TEXT) - 帖子内容
- images (JSON) - 图片数组 (存储图片URL)
- likes_count (INT, DEFAULT 0) - 点赞数
- comments_count (INT, DEFAULT 0) - 评论数
- shares_count (INT, DEFAULT 0) - 分享数
- is_top (TINYINT, DEFAULT 0) - 是否置顶
- status (TINYINT, DEFAULT 1) - 状态 (0:删除, 1:正常, 2:审核中)
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) - 更新时间

### 5. 帖子评论表 (post_comments)
- id (INT, PRIMARY KEY, AUTO_INCREMENT) - 评论ID
- post_id (INT, FOREIGN KEY) - 帖子ID
- user_id (INT, FOREIGN KEY) - 用户ID
- parent_id (INT, FOREIGN KEY, NULL) - 父评论ID (回复功能)
- content (TEXT) - 评论内容
- likes_count (INT, DEFAULT 0) - 点赞数
- status (TINYINT, DEFAULT 1) - 状态 (0:删除, 1:正常)
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) - 更新时间

### 6. 点赞记录表 (likes)
- id (INT, PRIMARY KEY, AUTO_INCREMENT) - 点赞ID
- user_id (INT, FOREIGN KEY) - 用户ID
- target_type (VARCHAR(20)) - 目标类型 (post/comment)
- target_id (INT) - 目标ID
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间
- UNIQUE KEY unique_like (user_id, target_type, target_id) - 防止重复点赞

### 7. 积分记录表 (score_records)
- id (INT, PRIMARY KEY, AUTO_INCREMENT) - 记录ID
- user_id (INT, FOREIGN KEY) - 用户ID
- type (VARCHAR(20)) - 积分类型 (register/post/comment/like)
- points (INT) - 积分变动 (正数为增加，负数为减少)
- description (VARCHAR(255)) - 积分描述
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间

### 8. 分享记录表 (share_records)
- id (INT, PRIMARY KEY, AUTO_INCREMENT) - 分享ID
- user_id (INT, FOREIGN KEY) - 用户ID
- post_id (INT, FOREIGN KEY) - 帖子ID
- share_type (VARCHAR(20)) - 分享类型 (friend/timeline/link)
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - 创建时间

## 索引设计

### 用户表索引
- INDEX idx_openid (openid)
- INDEX idx_created_at (created_at)

### 人参识别记录表索引
- INDEX idx_user_id (user_id)
- INDEX idx_created_at (created_at)

### 人参知识表索引
- INDEX idx_category (category)
- INDEX idx_sort_order (sort_order)
- INDEX idx_status (status)

### 帖子表索引
- INDEX idx_user_id (user_id)
- INDEX idx_created_at (created_at)
- INDEX idx_status (status)
- INDEX idx_is_top (is_top)

### 帖子评论表索引
- INDEX idx_post_id (post_id)
- INDEX idx_user_id (user_id)
- INDEX idx_parent_id (parent_id)
- INDEX idx_created_at (created_at)

### 点赞记录表索引
- INDEX idx_target (target_type, target_id)
- INDEX idx_created_at (created_at)

### 积分记录表索引
- INDEX idx_user_id (user_id)
- INDEX idx_type (type)
- INDEX idx_created_at (created_at)

### 分享记录表索引
- INDEX idx_user_id (user_id)
- INDEX idx_post_id (post_id)
- INDEX idx_created_at (created_at)
