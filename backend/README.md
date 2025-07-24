# 人参识别系统后端

基于Flask的人参识别系统后端API服务

## 功能特性

- 用户登录认证
- 人参图片识别分析
- 人参知识管理
- 用户论坛功能
- 积分系统
- 文件上传处理

## 技术栈

- **Web框架**: Flask 2.3.3
- **数据库**: MySQL 8.0+
- **图像处理**: Pillow
- **跨域支持**: Flask-CORS
- **数据库连接**: mysql-connector-python

## 安装部署

### 1. 环境要求

- Python 3.8+
- MySQL 8.0+
- pip

### 2. 克隆项目

```bash
git clone <repository-url>
cd backend
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 数据库配置

1. 创建MySQL数据库
2. 修改 `init_database.py` 中的数据库配置
3. 修改 `app.py` 中的数据库配置

```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',  # 修改为您的MySQL密码
    'database': 'ginseng_system',
    'charset': 'utf8mb4'
}
```

### 5. 初始化数据库

```bash
python init_database.py
```

### 6. 启动服务

```bash
# Linux/Mac
./start.sh

# Windows
start.bat

# 或者直接运行
python app.py
```

服务将在 `http://localhost:5000` 启动

## API文档

### 用户相关

#### 用户登录
- **POST** `/api/user/login`
- **参数**: `{code: string, userInfo: object}`
- **返回**: 用户信息和登录状态

#### 获取用户积分
- **GET** `/api/user/{user_id}/score`
- **返回**: 用户当前积分

### 人参识别

#### 人参图片分析
- **POST** `/api/ginseng/analyze`
- **参数**: 图片文件 + user_id
- **返回**: 识别结果（类型、年龄、置信度、描述）

### 知识管理

#### 获取人参知识
- **GET** `/api/knowledge`
- **返回**: 人参知识列表

### 论坛功能

#### 获取帖子列表
- **GET** `/api/posts`
- **参数**: `page`, `limit`
- **返回**: 帖子列表和分页信息

#### 创建帖子
- **POST** `/api/posts`
- **参数**: `{user_id, title, content, images}`
- **返回**: 创建结果

#### 获取帖子详情
- **GET** `/api/posts/{post_id}`
- **返回**: 帖子详情和评论列表

#### 创建评论
- **POST** `/api/posts/{post_id}/comments`
- **参数**: `{user_id, content, parent_id}`
- **返回**: 评论创建结果

#### 点赞帖子
- **POST** `/api/posts/{post_id}/like`
- **参数**: `{user_id}`
- **返回**: 点赞结果

### 文件服务

#### 访问上传文件
- **GET** `/uploads/{filename}`
- **返回**: 文件内容

## 数据库设计

### 主要数据表

1. **users**: 用户信息表
2. **ginseng_records**: 人参识别记录表
3. **ginseng_knowledge**: 人参知识表
4. **posts**: 帖子表
5. **post_comments**: 帖子评论表
6. **likes**: 点赞记录表
7. **score_records**: 积分记录表
8. **share_records**: 分享记录表

详细的数据库设计请参考 `database_design.md`

## 开发说明

### 目录结构

```
backend/
├── app.py                  # Flask应用主文件
├── init_database.py        # 数据库初始化脚本
├── requirements.txt        # Python依赖
├── database_design.md      # 数据库设计文档
├── start.sh               # Linux/Mac启动脚本
├── start.bat              # Windows启动脚本
├── .env.example           # 环境变量配置示例
├── uploads/               # 上传文件存储目录
└── README.md              # 本文档
```

### 核心功能

1. **用户认证**: 模拟微信登录，实际项目中需要集成微信API
2. **图片识别**: 目前使用Mock数据，实际项目中需要集成YOLO模型
3. **积分系统**: 自动记录用户积分变动
4. **文件上传**: 支持图片上传和访问

### 扩展功能

- [ ] 集成真实的YOLO模型
- [ ] 微信小程序授权登录
- [ ] 图片压缩和优化
- [ ] 缓存机制
- [ ] 日志记录
- [ ] API限流
- [ ] 数据备份

## 注意事项

1. 请修改默认的数据库密码
2. 生产环境中请关闭DEBUG模式
3. 建议使用HTTPS协议
4. 定期备份数据库
5. 监控系统资源使用情况

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查MySQL服务是否启动
   - 验证数据库配置信息
   - 确认数据库用户权限

2. **图片上传失败**
   - 检查uploads目录权限
   - 验证文件大小限制
   - 确认文件格式支持

3. **接口访问失败**
   - 检查端口是否被占用
   - 验证跨域配置
   - 查看错误日志

## 联系方式

如有问题请联系开发团队。
