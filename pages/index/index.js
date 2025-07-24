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
    const userScore = wx.getStorageSync('userScore') || 100
    this.setData({
      userScore: userScore
    })
  },
  
  // 登录获取用户信息
  login() {
    app.getUserInfo((userInfo) => {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
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
  
  // 模拟分析图片
  analyzeImage(imagePath) {
    this.setData({
      isAnalyzing: true,
      analysisResult: null
    })
    
    wx.showLoading({
      title: '分析中...'
    })
    
    // 模拟后端分析过程
    setTimeout(() => {
      // 模拟分析结果
      const mockResults = [
        {
          type: '原参',
          age: '3-5年',
          confidence: '95.2%',
          description: '这是一株品质优良的原参，参龄较为理想。'
        },
        {
          type: '林下山参',
          age: '8-12年',
          confidence: '87.6%',
          description: '这是一株珍贵的林下山参，年份较长，营养价值很高。'
        }
      ]
      
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)]
      
      this.setData({
        isAnalyzing: false,
        analysisResult: randomResult
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '分析完成',
        icon: 'success'
      })
    }, 2000)
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
