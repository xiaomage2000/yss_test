@echo off
chcp 65001
echo 正在启动人参识别系统后端...

REM 检查Python环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Python 未安装
    pause
    exit /b 1
)

REM 检查pip
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: pip 未安装
    pause
    exit /b 1
)

REM 安装依赖
echo 正在安装Python依赖...
pip install -r requirements.txt

REM 检查MySQL连接
echo 正在检查MySQL连接...
python -c "import mysql.connector; print('MySQL连接正常')" 2>nul || (
    echo 警告: MySQL连接失败，请检查数据库配置
)

REM 初始化数据库
echo 正在初始化数据库...
python init_database.py

REM 启动Flask应用
echo 正在启动Flask应用...
python app.py

pause
