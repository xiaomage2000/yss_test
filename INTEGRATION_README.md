# 人参识别系统 - 前后端对接指南

## 项目概述

本项目是一个人参识别和交流的微信小程序，包含前端（微信小程序）和后端（Flask API）两部分。

## 功能特性

### 前端功能
- ✅ 人参拍照识别（模拟）
- ✅ 人参知识库
- ✅ 用户论坛系统
- ✅ 发布帖子功能
- ✅ 我的帖子管理
- ✅ 点赞、评论、分享
- ✅ 积分系统
- ✅ 用户登录状态管理

### 后端功能
- ✅ 用户认证API
- ✅ 帖子CRUD操作
- ✅ 评论系统
- ✅ 点赞功能
- ✅ 文件上传
- ✅ 积分管理
- ✅ MySQL数据库

## 技术栈

- **前端**: 微信小程序 (WXML, WXSS, JavaScript)
- **后端**: Flask + MySQL
- **API**: RESTful API
- **域名**: api.051700.xyz

## 最新更新

### Bug修复
1. ✅ **修复论坛图片点击冲突**: 移除了论坛页面的图片预览功能，避免与帖子导航冲突
2. ✅ **添加"我的帖子"功能**: 在论坛顶部添加了"我的帖子"入口，支持查看和删除个人帖子

### 前后端集成
1. ✅ **API请求封装**: 在 `app.js` 中添加了通用的API请求方法
2. ✅ **降级策略**: API失败时自动降级为本地存储模式
3. ✅ **数据格式转换**: 后端数据格式与前端格式的自动转换

## 部署与测试

### 1. 后端启动

```bash
cd backend
pip install -r requirements.txt
python init_database.py  # 初始化数据库
python app.py
```

### 2. API测试

```bash
cd backend
python test_api.py
```

### 3. 前端配置

前端已配置API基础URL为 `https://api.051700.xyz`，支持：
- 自动API调用
- 失败时降级为本地模式
- 数据同步

## API端点

### 基础API
- `GET /api/health` - 健康检查
- `POST /api/user/login` - 用户登录

### 帖子API
- `GET /api/posts` - 获取帖子列表
- `POST /api/posts` - 创建新帖子
- `GET /api/posts/{id}` - 获取帖子详情
- `DELETE /api/posts/{id}` - 删除帖子
- `GET /api/users/{user_id}/posts` - 获取用户帖子

### 交互API
- `POST /api/posts/{id}/like` - 点赞帖子
- `POST /api/posts/{id}/comments` - 添加评论
- `GET /api/user/{id}/score` - 获取用户积分

## 页面结构

```
pages/
├── index/          # 拍照识别主页
├── knowledge/      # 人参知识库
├── forum/          # 用户论坛
├── createPost/     # 发布帖子
├── postDetail/     # 帖子详情
├── myPosts/        # 我的帖子 (新增)
└── logs/           # 日志页面
```

## 核心功能说明

### 我的帖子页面 (新增)
- 路径: `/pages/myPosts/myPosts`
- 功能: 显示当前用户的所有帖子
- 特性: 支持删除帖子，一键返回论坛
- API集成: 自动从后端获取用户帖子

### 论坛页面优化
- 修复: 移除图片点击预览功能，避免与帖子导航冲突
- 新增: "我的帖子"统计和入口
- 布局: 帖子总数 | 我的帖子 | 我的积分

### API集成策略
1. **优先级**: API调用 > 本地存储
2. **降级**: API失败时使用本地数据
3. **同步**: API成功时更新本地存储
4. **兼容**: 保持原有功能不受影响

## 下一步计划

1. **服务器部署**: 将后端部署到 api.051700.xyz
2. **数据库配置**: 配置生产环境数据库
3. **性能优化**: 添加缓存和请求优化
4. **错误处理**: 完善API错误处理机制
5. **用户体验**: 添加加载状态和错误提示

## 注意事项

1. **API域名**: 确保 `api.051700.xyz` 可正常访问
2. **数据库**: 需要MySQL数据库支持
3. **CORS**: 后端已配置跨域支持
4. **降级模式**: 即使后端不可用，前端仍可正常运行
5. **数据一致性**: 在线模式和离线模式的数据需要同步

## 文件变更记录

### 新增文件
- `pages/myPosts/myPosts.js` - 我的帖子页面逻辑
- `pages/myPosts/myPosts.wxml` - 我的帖子页面结构
- `pages/myPosts/myPosts.wxss` - 我的帖子页面样式
- `pages/myPosts/myPosts.json` - 我的帖子页面配置
- `backend/test_api.py` - API测试脚本

### 修改文件
- `app.js` - 添加API请求封装
- `app.json` - 注册新页面
- `pages/forum/forum.js` - 集成API，添加我的帖子功能
- `pages/forum/forum.wxml` - 添加我的帖子入口
- `pages/forum/forum.wxss` - 优化三列布局样式
- `pages/createPost/createPost.js` - 集成发布API
- `backend/app.py` - 添加用户帖子和删除接口

本项目现已完成前后端基础集成，具备完整的降级和容错机制。
