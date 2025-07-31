// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    this.login()
  },
  
  // 用户登录
  login() {
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功，code:', res.code)
        
        // 检查用户是否已经完成信息设置
        this.checkAndHandleUserLogin(res.code)
      },
      fail: err => {
        console.error('登录失败:', err)
      }
    })
  },
  
  // 检查和处理用户登录
  checkAndHandleUserLogin(code) {
    // 调用后端检查用户是否存在
    this.request({
      url: '/api/user/check',
      method: 'POST',
      data: { code: code },
      success: (res) => {
        if (res.success) {
          if (res.data.exists) {
            // 用户已存在，直接登录
            const userInfo = {
              id: res.data.user.id,
              nickName: res.data.user.nickname,
              avatarUrl: res.data.user.avatar_url,
              score: res.data.user.score
            }
            
            wx.setStorageSync('userInfo', userInfo)
            wx.setStorageSync('userScore', res.data.user.score)
            this.globalData.userInfo = userInfo
            this.globalData.hasUserInfo = true
            console.log('用户已存在，自动登录成功')
            
            // 通知所有页面更新用户信息
            this.notifyUserInfoUpdate()
          } else {
            // 新用户，显示欢迎弹窗
            this.showWelcomeModal(code)
          }
        } else {
          // API调用失败，显示欢迎弹窗
          this.showWelcomeModal(code)
        }
      },
      fail: (err) => {
        console.error('检查用户失败:', err)
        // 网络失败，显示欢迎弹窗
        this.showWelcomeModal(code)
      }
    })
  },
  
  // 显示欢迎弹窗
  showWelcomeModal(code) {
    setTimeout(() => {
      wx.showModal({
        title: '欢迎使用人参识别助手',
        content: '为了提供更好的服务，需要完善您的个人信息。',
        confirmText: '确定',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) {
            // 用户点击确定，跳转到用户信息填写页面
            wx.navigateTo({
              url: `/pages/userProfile/userProfile?code=${code}`
            })
          } else {
            // 用户点击稍后，取消登录
            console.log('用户取消登录')
            this.globalData.hasUserInfo = false
          }
        }
      })
    }, 1000) // 延迟1秒显示，避免与小程序启动冲突
  },
  
  // 检查用户信息（保留为兼容性）
  checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    const userScore = wx.getStorageSync('userScore')
    
    this.globalData.userInfo = userInfo
    this.globalData.userScore = userScore || 100
    this.globalData.hasUserInfo = !!userInfo
  },
  
  // 获取用户信息
  getUserInfo(callback) {
    if (this.globalData.userInfo) {
      callback && callback(this.globalData.userInfo)
    } else {
      wx.getUserProfile({
        desc: '用于显示用户信息和个性化服务',
        success: (res) => {
          this.globalData.userInfo = res.userInfo
          wx.setStorageSync('userInfo', res.userInfo)
          callback && callback(res.userInfo)
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err)
          callback && callback(null)
        }
      })
    }
  },
  
  // 检查用户是否已登录
  checkUserLogin(callback) {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      callback && callback(true, userInfo)
    } else {
      // 提示用户登录
      wx.showModal({
        title: '需要登录',
        content: '该功能需要登录后才能使用，是否立即登录？',
        success: (res) => {
          if (res.confirm) {
            this.getUserInfo((userInfo) => {
              if (userInfo) {
                callback && callback(true, userInfo)
              } else {
                callback && callback(false, null)
              }
            })
          } else {
            callback && callback(false, null)
          }
        }
      })
    }
  },
  
  // 更新积分
  updateScore(points) {
    const currentScore = wx.getStorageSync('userScore') || 100
    const newScore = currentScore + points
    wx.setStorageSync('userScore', newScore)
    this.globalData.userScore = newScore
    return newScore
  },
  
  // 网络请求封装
  request(options) {
    const baseUrl = this.globalData.apiBase
    const url = options.url.startsWith('http') ? options.url : `${baseUrl}${options.url}`
    
    // 获取当前用户信息，添加到请求头
    const userInfo = wx.getStorageSync('userInfo')
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    
    // 如果有用户信息，添加user-id到请求头
    if (userInfo && userInfo.id) {
      headers['user-id'] = userInfo.id.toString()
    } else {
      // 开发阶段使用默认用户ID
      headers['user-id'] = '1'
    }
    
    const { success, fail, ...otherOptions } = options
    
    wx.request({
      ...otherOptions,
      url: url,
      header: headers,
      success: (res) => {
        if (res.statusCode === 200) {
          if (success) success(res.data)
        } else {
          console.error('API请求失败:', res)
          if (fail) fail(res)
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err)
        if (fail) fail(err)
      }
    })
  },
  
  // 通知所有页面用户信息已更新
  notifyUserInfoUpdate() {
    // 创建一个简单的事件总线
    if (!wx.$eventBus) {
      wx.$eventBus = {}
    }
    wx.$eventBus.userInfoUpdated = true
    
    // 获取当前页面栈
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    
    // 如果当前页面有 getUserInfo 方法，就调用它
    if (currentPage && typeof currentPage.getUserInfo === 'function') {
      currentPage.getUserInfo()
    }
    
    // 如果当前页面有 getUserScore 方法，就调用它  
    if (currentPage && typeof currentPage.getUserScore === 'function') {
      currentPage.getUserScore()
    }
  },
  
  globalData: {
    userInfo: null,
    userScore: 100,
    apiBase: 'https://api.051700.xyz'  // API基础URL
  }
})
