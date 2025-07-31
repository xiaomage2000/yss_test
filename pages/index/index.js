// index.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    userInfo: null,
    userScore: 100,
    hasUserInfo: false,
    uploadedImage: '',
    analysisResult: null,
    isAnalyzing: false,
    apiStatus: {
      online: false,
      message: '检测中...',
      apiBase: ''
    }
  },
  
  onLoad() {
    // 获取用户信息（先获取用户信息再获取积分）
    this.getUserInfo()
    // 获取用户积分
    this.getUserScore()
    // 检测API状态
    this.checkAPIStatus()
  },
  
  onShow() {
    // 每次显示页面时更新积分和用户信息
    this.getUserInfo()
    this.getUserScore()
    
    // 检查全局用户信息更新事件
    if (wx.$eventBus && wx.$eventBus.userInfoUpdated) {
      this.getUserInfo()
      wx.$eventBus.userInfoUpdated = false
    }
  },
  
  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    const app = getApp()
    
    // 优先使用全局状态
    if (app.globalData.hasUserInfo && app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (userInfo) {
      // 如果全局状态没有，但本地存储有，则使用本地存储
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
      // 同时更新全局状态
      app.globalData.userInfo = userInfo
      app.globalData.hasUserInfo = true
    } else {
      // 都没有，设置为未登录状态
      this.setData({
        userInfo: null,
        hasUserInfo: false
      })
      app.globalData.hasUserInfo = false
    }
  },
  
  // 获取用户积分
  getUserScore() {
    const app = getApp()
    const userInfo = wx.getStorageSync('userInfo')
    
    // 如果用户未登录，积分显示为0
    if (!userInfo || !userInfo.id) {
      this.setData({
        userScore: 0
      })
      return
    }
    
    app.request({
      url: `/api/user/${userInfo.id}/score`, // 使用真实用户ID
      method: 'GET',
      success: (data) => {
        if (data.success) {
          this.setData({
            userScore: data.score
          })
          // 同时更新本地存储
          wx.setStorageSync('userScore', data.score)
        }
      },
      fail: (err) => {
        // API失败时使用本地存储的积分
        const userScore = wx.getStorageSync('userScore') || 0
        this.setData({
          userScore: userScore
        })
      }
    })
  },
  
  // 登录获取用户信息
  login() {
    // 检查用户是否已经登录
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      wx.showToast({
        title: '您已登录',
        icon: 'success'
      })
      return
    }
    
    // 引导用户登录
    wx.showModal({
      title: '需要登录',
      content: '请先完善您的个人信息后再使用此功能',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 获取登录凭证后调用检查用户接口
          wx.login({
            success: (loginRes) => {
              if (loginRes.code) {
                // 调用全局的检查用户登录方法
                const app = getApp()
                app.checkAndHandleUserLogin(loginRes.code)
              } else {
                wx.showToast({
                  title: '获取登录凭证失败',
                  icon: 'error'
                })
              }
            },
            fail: (err) => {
              console.log('微信登录失败:', err)
              wx.showToast({
                title: '微信登录失败',
                icon: 'error'
              })
            }
          })
        }
      }
    })
  },
  
  // 拍照上传
  takePhoto() {
    // 检查用户是否已登录
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.showModal({
        title: '需要登录',
        content: '请先完善您的个人信息后再使用人参识别功能',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.login()
          }
        }
      })
      return
    }
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          uploadedImage: tempFilePath
        })
        // 模拟上传和分析
        this.analyzeImage(tempFilePath)
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        })
      }
    })
  },
  
  // 分析图片
  analyzeImage(imagePath) {
    this.setData({
      isAnalyzing: true,
      analysisResult: null
    })
    
    wx.showLoading({
      title: '上传分析中...'
    })
    
    // 上传图片到后端进行分析
    this.uploadAndAnalyze(imagePath)
  },

  // 上传并分析图片
  uploadAndAnalyze(imagePath) {
    const app = getApp()
    
    wx.uploadFile({
      url: `${app.globalData.apiBase}/api/ginseng/analyze`,
      filePath: imagePath,
      name: 'image',
      formData: {
        user_id: 1 // 模拟用户ID
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.success) {
            this.setData({
              isAnalyzing: false,
              analysisResult: {
                type: data.result.type,
                age: data.result.age,
                confidence: data.result.confidence,
                description: data.result.description || '人参识别分析完成'
              }
            })
            
            wx.hideLoading()
            wx.showToast({
              title: '分析完成',
              icon: 'success'
            })
            
            // 增加积分
            app.updateScore(10)
          } else {
            this.handleAnalysisError(data.error)
          }
        } catch (e) {
          console.error('解析响应失败:', e, res.data)
          this.handleAnalysisError('解析响应失败: ' + e.message)
        }
      },
      fail: (err) => {
        this.handleAnalysisError('网络错误')
      }
    })
  },

  // 处理分析错误
  handleAnalysisError(errorMsg) {
    wx.hideLoading()
    this.setData({
      isAnalyzing: false
    })
    
    wx.showToast({
      title: errorMsg || '分析失败',
      icon: 'error'
    })
  },
  
  // 重新分析
  reAnalyze() {
    if (this.data.uploadedImage) {
      this.analyzeImage(this.data.uploadedImage)
    }
  },
  
  // 页面分享函数
  onShareAppMessage(res) {
    return {
      title: '人参识别助手 - AI智能识别人参品种和参龄',
      desc: '上传人参照片，快速识别品种和年份',
      path: '/pages/index/index'
    }
  },
  
  onShareTimeline(res) {
    return {
      title: '人参识别助手 - AI智能识别人参品种和参龄',
      path: '/pages/index/index'
    }
  },

  // 检测API状态
  async checkAPIStatus() {
    try {
      const status = await util.getAPIStatus()
      this.setData({
        apiStatus: status
      })
    } catch (err) {
      console.error('检测API状态失败:', err)
      this.setData({
        apiStatus: {
          online: false,
          message: 'API检测失败',
          apiBase: app.globalData.apiBase
        }
      })
    }
  }
})
