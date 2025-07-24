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
        
        // 模拟登录成功后的处理
        this.checkUserInfo()
        
        // 自动获取用户信息
        this.autoGetUserInfo()
      },
      fail: err => {
        console.error('登录失败:', err)
      }
    })
  },
  
  // 自动获取用户信息
  autoGetUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      // 如果没有用户信息，主动请求用户授权
      setTimeout(() => {
        wx.showModal({
          title: '欢迎使用人参识别助手',
          content: '为了提供更好的服务，需要获取您的基本信息。点击"确定"进行授权登录。',
          confirmText: '确定',
          cancelText: '稍后',
          success: (res) => {
            if (res.confirm) {
              this.getUserInfo((userInfo) => {
                if (userInfo) {
                  console.log('用户授权成功:', userInfo)
                  // 通知所有页面用户信息已更新
                  wx.$eventBus = wx.$eventBus || {}
                  wx.$eventBus.userInfoUpdated = true
                } else {
                  console.log('用户拒绝授权')
                }
              })
            } else {
              console.log('用户选择稍后授权')
            }
          }
        })
      }, 1000) // 延迟1秒显示，避免与小程序启动冲突
    }
  },
  
  // 检查用户信息
  checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    const userScore = wx.getStorageSync('userScore')
    
    if (!userInfo) {
      // 新用户，初始化积分
      wx.setStorageSync('userScore', 100)
      console.log('新用户注册，获得100积分')
    }
    
    this.globalData.userInfo = userInfo
    this.globalData.userScore = userScore || 100
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
  
  globalData: {
    userInfo: null,
    userScore: 100
  }
})
