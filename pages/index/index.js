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
    // 获取用户信息
    this.getUserInfo()
    // 获取用户积分
    this.getUserScore()
    // 检测API状态
    this.checkAPIStatus()
  },
  
  onShow() {
    // 每次显示页面时更新积分和用户信息
    this.getUserScore()
    this.getUserInfo()
    
    // 检查全局用户信息更新事件
    if (wx.$eventBus && wx.$eventBus.userInfoUpdated) {
      this.getUserInfo()
      wx.$eventBus.userInfoUpdated = false
    }
  },
  
  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
    }
  },
  
  // 获取用户积分
  getUserScore() {
    const app = getApp()
    
    app.request({
      url: '/api/user/1/score', // 模拟用户ID
      method: 'GET',
      success: (data) => {
        if (data.success && data.data) {
          this.setData({
            userScore: data.data.total_score
          })
        }
      },
      fail: (err) => {
        // API失败时使用本地存储的积分
        const userScore = wx.getStorageSync('userScore') || 100
        this.setData({
          userScore: userScore
        })
      }
    })
  },
  
  // 登录获取用户信息
  login() {
    app.getUserInfo((userInfo) => {
      if (userInfo) {
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        })
        // 登录成功后重新获取积分
        this.getUserScore()
      }
    })
  },
  
  // 拍照上传
  takePhoto() {
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
