"""
前后端API测试脚本
用于测试API连接和功能
"""

import requests
import json

API_BASE = 'https://api.051700.xyz'

def test_api_connection():
    """测试API连接"""
    try:
        response = requests.get(f'{API_BASE}/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ API连接成功")
            return True
        else:
            print(f"❌ API连接失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API连接失败: {e}")
        return False

def test_get_posts():
    """测试获取帖子列表"""
    try:
        response = requests.get(f'{API_BASE}/api/posts')
        if response.status_code == 200:
            data = response.json()
            print("✅ 获取帖子列表成功")
            print(f"   帖子数量: {len(data.get('data', []))}")
            return True
        else:
            print(f"❌ 获取帖子列表失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 获取帖子列表失败: {e}")
        return False

def test_create_post():
    """测试创建帖子"""
    try:
        post_data = {
            'user_id': 1,
            'title': '测试帖子',
            'content': '这是一个测试帖子内容',
            'images': '[]'
        }
        
        response = requests.post(f'{API_BASE}/api/posts', json=post_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ 创建帖子成功")
                return True
            else:
                print(f"❌ 创建帖子失败: {data.get('error')}")
                return False
        else:
            print(f"❌ 创建帖子失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 创建帖子失败: {e}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始API测试...")
    print("-" * 50)
    
    # 测试API连接
    if not test_api_connection():
        print("\n❌ 无法连接到API服务器，请检查:")
        print("1. 服务器是否已启动")
        print("2. 域名 api.051700.xyz 是否可访问")
        print("3. 防火墙设置")
        return
    
    print()
    
    # 测试获取帖子
    test_get_posts()
    print()
    
    # 测试创建帖子
    test_create_post()
    
    print()
    print("-" * 50)
    print("✅ API测试完成")

if __name__ == '__main__':
    main()
