// createPost.js
const app = getApp()

Page({
  data: {
    title: '',
    content: '',
    images: [],
    userInfo: null
  },
  
  onLoad() {
    this.getUserInfo()
  },
  
  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      })
    } else {
      wx.showToast({
        title: '请先登录',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },
  
  // 输入标题
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },
  
  // 输入内容
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    })
  },
  
  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 9 - this.data.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath)
        this.setData({
          images: [...this.data.images, ...newImages]
        })
      }
    })
  },
  
  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    images.splice(index, 1)
    this.setData({
      images: images
    })
  },
  
  // 发布帖子
  publishPost() {
    if (!this.data.title.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'error'
      })
      return
    }
    
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'error'
      })
      return
    }
    
    // 创建新帖子
    const newPost = {
      id: Date.now(),
      title: this.data.title,
      content: this.data.content,
      author: this.data.userInfo.nickName,
      avatar: this.data.userInfo.avatarUrl,
      createTime: this.formatTime(new Date()),
      images: this.data.images,
      likes: 0,
      comments: 0,
      liked: false
    }
    
    // 保存到本地存储
    const posts = wx.getStorageSync('posts') || []
    posts.unshift(newPost)
    wx.setStorageSync('posts', posts)
    
    // 增加积分
    app.updateScore(20)
    
    wx.showToast({
      title: '发布成功，+20积分',
      icon: 'success'
    })
    
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },
  
  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }
})
