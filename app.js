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
      },
      fail: err => {
        console.error('登录失败:', err)
      }
    })
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
        desc: '用于显示用户信息',
        success: (res) => {
          this.globalData.userInfo = res.userInfo
          wx.setStorageSync('userInfo', res.userInfo)
          callback && callback(res.userInfo)
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err)
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
