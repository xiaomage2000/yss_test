// forum.js
const app = getApp()

Page({
  data: {
    posts: [],
    userInfo: null,
    userScore: 100,
    myPostsCount: 0
  },
  
  onLoad() {
    this.getUserInfo()
    this.loadPosts()
  },
  
  onShow() {
    // 每次显示页面时重新加载帖子和积分
    this.loadPosts()
    this.getUserScore()
    this.updateMyPostsCount()
  },
  
  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo: userInfo
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
  
  // 加载帖子列表
  loadPosts() {
    // 首先尝试从后端获取帖子
    this.loadPostsFromAPI()
  },

  // 从API获取帖子
  loadPostsFromAPI() {
    const app = getApp()
    
    wx.showLoading({
      title: '加载中...'
    })
    
    app.request({
      url: '/api/posts',
      method: 'GET',
      success: (data) => {
        wx.hideLoading()
        if (data.success && data.data) {
          // 转换后端数据格式为前端需要的格式
          const posts = data.data.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            author: post.author_nickname || post.author,
            avatar: post.author_avatar || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
            createTime: this.formatTime(post.created_at),
            images: this.parseImages(post.images),
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
            liked: false // 这里需要根据用户状态判断
          }))
          
          this.setData({
            posts: posts
          })
          
          // 帖子加载完成后更新我的帖子数量
          this.updateMyPostsCount()
          
          // 同时保存到本地存储作为备份
          wx.setStorageSync('posts', posts)
        } else {
          wx.showToast({
            title: '获取帖子失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        })
      }
    })
  },

  // 发布新帖子
  createPost() {
    const app = getApp()
    app.checkUserLogin((isLoggedIn, userInfo) => {
      if (isLoggedIn) {
        wx.navigateTo({
          url: '/pages/createPost/createPost'
        })
      } else {
        wx.showToast({
          title: '未登录，无法发帖',
          icon: 'error'
        })
      }
    })
  },
  
  // 查看帖子详情
  viewPost(e) {
    const postId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/postDetail/postDetail?id=${postId}`
    })
  },
  
  // 点赞帖子
  likePost(e) {
    const app = getApp()
    app.checkUserLogin((isLoggedIn, userInfo) => {
      if (isLoggedIn) {
        const index = e.currentTarget.dataset.index
        const post = this.data.posts[index]
        
        // 调用API点赞
        this.likePostAPI(post.id, index, !post.liked)
      } else {
        wx.showToast({
          title: '未登录，无法点赞',
          icon: 'error'
        })
      }
    })
  },

  // 通过API点赞
  likePostAPI(postId, index, isLike) {
    const app = getApp()
    
    app.request({
      url: `/api/posts/${postId}/like`,
      method: 'POST',
      data: {
        user_id: 1, // 模拟用户ID
        action: isLike ? 'like' : 'unlike'
      },
      success: (data) => {
        if (data.success) {
          // 更新本地状态
          const post = this.data.posts[index]
          const likes = isLike ? post.likes + 1 : post.likes - 1
          
          this.setData({
            [`posts[${index}].liked`]: isLike,
            [`posts[${index}].likes`]: likes
          })
          
          wx.showToast({
            title: isLike ? '点赞成功' : '取消点赞',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: data.error || '操作失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        })
      }
    })
  },
  
  // 分享帖子到微信
  sharePost(e) {
    const index = e.currentTarget.dataset.index
    const post = this.data.posts[index]
    
    // 存储要分享的帖子信息
    this.sharePostData = post
    
    wx.showActionSheet({
      itemList: ['分享给微信好友', '复制链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 分享给好友 - 提示用户点击右上角分享按钮
          wx.showModal({
            title: '分享提示',
            content: '请点击右上角的分享按钮，选择"发送给朋友"来分享这个帖子',
            showCancel: false,
            confirmText: '知道了'
          })
        } else if (res.tapIndex === 1) {
          // 复制链接
          wx.setClipboardData({
            data: `人参识别助手 - ${post.title}: ${post.content}`,
            success: () => {
              wx.showToast({
                title: '链接已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },
  
  // 分享给好友（页面级别的分享函数）
  onShareAppMessage(res) {
    if (this.sharePostData) {
      const post = this.sharePostData
      return {
        title: post.title,
        desc: post.content,
        path: `/pages/postDetail/postDetail?id=${post.id}`,
        imageUrl: post.images && post.images.length > 0 ? post.images[0] : ''
      }
    }
    return {
      title: '人参识别助手 - 专业的人参识别和交流平台',
      path: '/pages/forum/forum',
      imageUrl: ''
    }
  },
  
  // 分享到朋友圈（页面级别的分享函数）
  onShareTimeline(res) {
    if (this.sharePostData) {
      const post = this.sharePostData
      return {
        title: `${post.title} - 人参识别助手`,
        path: `/pages/postDetail/postDetail?id=${post.id}`,
        imageUrl: post.images && post.images.length > 0 ? post.images[0] : ''
      }
    }
    return {
      title: '人参识别助手 - 专业的人参识别和交流平台',
      path: '/pages/forum/forum',
      imageUrl: ''
    }
  },
  
  // 更新我的帖子数量
  updateMyPostsCount() {
    const app = getApp()
    app.checkUserLogin((isLoggedIn, userInfo) => {
      if (isLoggedIn) {
        // 调用API获取用户帖子数量
        app.request({
          url: '/api/user/posts',
          method: 'GET',
          data: { page: 1, limit: 1 }, // 只需要获取总数
          success: (res) => {
            if (res.data.success && res.data.pagination) {
              this.setData({
                myPostsCount: res.data.pagination.total
              })
            } else {
              // 如果API调用失败，使用本地过滤作为备选
              const myPosts = this.data.posts.filter(post => post.author === (userInfo.nickName || userInfo.nickname))
              this.setData({
                myPostsCount: myPosts.length
              })
            }
          },
          fail: (err) => {
            console.error('获取用户帖子数量失败:', err)
            // API调用失败时，使用本地过滤作为备选
            const myPosts = this.data.posts.filter(post => post.author === (userInfo.nickName || userInfo.nickname))
            this.setData({
              myPostsCount: myPosts.length
            })
          }
        })
      } else {
        this.setData({
          myPostsCount: 0
        })
      }
    })
  },
  
  // 查看我的帖子
  viewMyPosts() {
    const app = getApp()
    app.checkUserLogin((isLoggedIn, userInfo) => {
      if (isLoggedIn) {
        wx.navigateTo({
          url: '/pages/myPosts/myPosts'
        })
      } else {
        wx.showToast({
          title: '请先登录',
          icon: 'error'
        })
      }
    })
  },

  // 解析图片数组 - 修复JSON数组解析问题
  parseImages(images) {
    if (!images) return []
    
    try {
      // 如果已经是数组，直接返回
      if (Array.isArray(images)) {
        return images
      }
      
      // 如果是字符串
      if (typeof images === 'string') {
        // 处理空数组字符串
        if (images.trim() === '[]' || images.trim() === '') {
          return []
        }
        
        // 尝试解析JSON
        const parsed = JSON.parse(images)
        const parsed1 = JSON.parse(parsed)
        const prefix = app.globalData.apiBase;
        const fullUrls = parsed1.map(path => prefix + path);
        return fullUrls
      }
      
      return []
    } catch (e) {
      console.error('解析图片数组失败:', e, images)
      // 如果解析失败，尝试其他方法
      if (typeof images === 'string' && images.length > 0) {
        // 可能是单个图片URL
        return [images]
      }
      return []
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return ''
    
    try {
      // 处理各种时间格式，确保iOS兼容
      let date
      if (typeof timestamp === 'string') {
        // 处理GMT格式时间，转换为iOS支持的格式
        if (timestamp.includes('GMT')) {
          date = new Date(timestamp.replace(/GMT.*$/, '').trim())
        } else {
          // 将时间格式标准化为iOS支持的格式
          const isoString = timestamp.replace(/\s+/, 'T').replace(/\s+GMT.*$/, '')
          date = new Date(isoString)
        }
      } else {
        date = new Date(timestamp)
      }
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', timestamp)
        return ''
      }
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hour}:${minute}`
    } catch (e) {
      console.error('时间格式化错误:', e, timestamp)
      return ''
    }
  }
})
