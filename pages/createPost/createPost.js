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
    
    // 尝试通过API发布
    this.publishPostToAPI()
  },

  // 通过API发布帖子
  publishPostToAPI() {
    const app = getApp()
    
    wx.showLoading({
      title: '发布中...'
    })
    
    // 如果有图片，先上传图片
    if (this.data.images.length > 0) {
      this.uploadImages().then((imageUrls) => {
        this.submitPostToAPI(imageUrls)
      }).catch((err) => {
        wx.hideLoading()
        console.error('图片上传失败:', err)
        // 图片上传失败，仍然尝试发布帖子但不包含图片
        this.submitPostToAPI([])
      })
    } else {
      // 没有图片，直接发布
      this.submitPostToAPI([])
    }
  },

  // 上传图片到服务器
  uploadImages() {
    return new Promise((resolve, reject) => {
      const app = getApp()
      const uploadPromises = this.data.images.map((imagePath) => {
        return new Promise((resolveUpload, rejectUpload) => {
          wx.uploadFile({
            url: `${app.globalData.apiBase}/api/upload/image`,
            filePath: imagePath,
            name: 'image',
            success: (res) => {
              try {
                const data = JSON.parse(res.data)
                if (data.success) {
                  resolveUpload(data.url)
                } else {
                  rejectUpload(new Error(data.error || '上传失败'))
                }
              } catch (e) {
                console.log(e)
                rejectUpload(new Error('解析响应失败'))
              }
            },
            fail: rejectUpload
          })
        })
      })

      Promise.all(uploadPromises)
        .then(resolve)
        .catch(reject)
    })
  },

  // 提交帖子到API
  submitPostToAPI(imageUrls) {
    const app = getApp()
    const userId = this.data.userInfo.id || 1 // 模拟用户ID
    
    const postData = {
      user_id: userId,
      title: this.data.title,
      content: this.data.content,
      images: JSON.stringify(imageUrls)
    }
    
    app.request({
      url: '/api/posts',
      method: 'POST',
      data: postData,
      success: (data) => {
        wx.hideLoading()
        if (data.success) {
          // API发布成功
          const app = getApp()
          app.updateScore(20)
          wx.showToast({
            title: '发布成功，+20积分',
            icon: 'success'
          })
          
          // 保存到本地存储，使用服务器返回的图片URLs
          this.savePostLocally(data.data, imageUrls)
          
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({
            title: data.error || '发布失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误，发布失败',
          icon: 'error'
        })
      }
    })
  },

  // 保存帖子到本地存储
  savePostLocally(postData, imageUrls) {
    // 确保postData存在，如果不存在则创建默认对象
    const safePostData = postData || {}
    
    const newPost = {
      id: safePostData.id || Date.now(),
      title: safePostData.title || this.data.title,
      content: safePostData.content || this.data.content,
      author: this.data.userInfo.nickName,
      avatar: this.data.userInfo.avatarUrl,
      createTime: safePostData.created_at ? this.formatTime(new Date(safePostData.created_at)) : this.formatTime(new Date()),
      images: imageUrls || this.data.images, // 优先使用上传后的URL
      likes: safePostData.likes_count || 0,
      comments: safePostData.comments_count || 0,
      liked: false
    }
    
    // 保存到本地存储
    const posts = wx.getStorageSync('posts') || []
    posts.unshift(newPost)
    wx.setStorageSync('posts', posts)
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
