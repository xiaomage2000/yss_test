#!/bin/bash

# 人参识别系统后端启动脚本

echo "正在启动人参识别系统后端..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "错误: Python3 未安装"
    exit 1
fi

# 检查pip
if ! command -v pip3 &> /dev/null; then
    echo "错误: pip3 未安装"
    exit 1
fi

# 安装依赖
echo "正在安装Python依赖..."
pip3 install -r requirements.txt

# 检查MySQL连接
echo "正在检查MySQL连接..."
python3 -c "import mysql.connector; print('MySQL连接正常')" 2>/dev/null || {
    echo "警告: MySQL连接失败，请检查数据库配置"
}

# 初始化数据库
echo "正在初始化数据库..."
python3 init_database.py

# 启动Flask应用
echo "正在启动Flask应用..."
python3 app.py
