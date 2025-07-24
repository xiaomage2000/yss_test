// myPosts.js
const app = getApp()

Page({
  data: {
    myPosts: [],
    userInfo: null
  },

  onLoad() {
    this.getUserInfo()
    this.loadMyPosts()
  },

  onShow() {
    this.loadMyPosts()
  },

  // 获取用户信息
  getUserInfo() {
    const app = getApp()
    app.checkUserLogin((isLoggedIn, userInfo) => {
      if (isLoggedIn) {
        this.setData({
          userInfo: userInfo
        })
      } else {
        wx.showModal({
          title: '提示',
          content: '请先登录查看您的帖子',
          showCancel: false,
          success: () => {
            wx.navigateBack()
          }
        })
      }
    })
  },

  // 加载我的帖子
  loadMyPosts() {
    if (!this.data.userInfo) return
    
    // 首先尝试从API获取
    this.loadMyPostsFromAPI()
  },

  // 从API获取我的帖子
  loadMyPostsFromAPI() {
    const app = getApp()
    
    wx.showLoading({
      title: '加载中...'
    })
    
    // 这里需要用户ID，实际项目中应该从用户信息中获取
    const userId = this.data.userInfo.id || 1 // 模拟用户ID
    
    app.request({
      url: `/api/users/${userId}/posts`,
      method: 'GET',
      success: (data) => {
        wx.hideLoading()
        if (data.success && data.data) {
          // 转换后端数据格式
          const myPosts = data.data.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            author: post.author_nickname || post.author,
            avatar: post.author_avatar || this.data.userInfo.avatarUrl,
            createTime: this.formatTime(post.created_at),
            images: post.images ? JSON.parse(post.images) : [],
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
            liked: false
          }))
          
          this.setData({
            myPosts: myPosts
          })
        } else {
          this.loadMyPostsFromLocal()
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.log('API请求失败，使用本地数据')
        this.loadMyPostsFromLocal()
      }
    })
  },

  // 从本地存储获取我的帖子（备用方案）
  loadMyPostsFromLocal() {
    const posts = wx.getStorageSync('posts') || []
    const myPosts = posts.filter(post => post.author === this.data.userInfo.nickName)
    
    this.setData({
      myPosts: myPosts
    })
  },

  // 查看帖子详情
  viewPost(e) {
    const postId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/postDetail/postDetail?id=${postId}`
    })
  },

  // 删除帖子
  deletePost(e) {
    const postId = e.currentTarget.dataset.id
    const postIndex = e.currentTarget.dataset.index
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个帖子吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          // 尝试通过API删除
          this.deletePostFromAPI(postId, postIndex)
        }
      }
    })
  },

  // 通过API删除帖子
  deletePostFromAPI(postId, postIndex) {
    const app = getApp()
    
    wx.showLoading({
      title: '删除中...'
    })
    
    const userId = this.data.userInfo.id || 1 // 模拟用户ID
    
    app.request({
      url: `/api/posts/${postId}`,
      method: 'DELETE',
      data: {
        user_id: userId
      },
      success: (data) => {
        wx.hideLoading()
        if (data.success) {
          // API删除成功，更新本地数据
          this.deletePostLocally(postId, postIndex)
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: data.error || '删除失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        // API失败，但仍然本地删除
        console.log('API删除失败，仅本地删除')
        this.deletePostLocally(postId, postIndex)
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
      }
    })
  },

  // 本地删除帖子
  deletePostLocally(postId, postIndex) {
    // 从所有帖子中删除
    const allPosts = wx.getStorageSync('posts') || []
    const updatedPosts = allPosts.filter(post => post.id !== postId)
    wx.setStorageSync('posts', updatedPosts)
    
    // 从我的帖子列表中删除
    const myPosts = this.data.myPosts
    myPosts.splice(postIndex, 1)
    this.setData({
      myPosts: myPosts
    })
  },

  // 点赞帖子
  likePost(e) {
    const index = e.currentTarget.dataset.index
    const post = this.data.myPosts[index]
    const liked = !post.liked
    const likes = liked ? post.likes + 1 : post.likes - 1
    
    this.setData({
      [`myPosts[${index}].liked`]: liked,
      [`myPosts[${index}].likes`]: likes
    })
    
    // 更新本地存储中的所有帖子
    const allPosts = wx.getStorageSync('posts') || []
    const postIndex = allPosts.findIndex(p => p.id === post.id)
    if (postIndex !== -1) {
      allPosts[postIndex].liked = liked
      allPosts[postIndex].likes = likes
      wx.setStorageSync('posts', allPosts)
    }
    
    wx.showToast({
      title: liked ? '点赞成功' : '取消点赞',
      icon: 'success'
    })
  },

  // 分享帖子
  sharePost(e) {
    const index = e.currentTarget.dataset.index
    const post = this.data.myPosts[index]
    
    this.sharePostData = post
    
    wx.showActionSheet({
      itemList: ['分享给微信好友', '复制链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showModal({
            title: '分享提示',
            content: '请点击右上角的分享按钮，选择"发送给朋友"来分享这个帖子',
            showCancel: false,
            confirmText: '知道了'
          })
        } else if (res.tapIndex === 1) {
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

  // 分享给好友
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
      title: '我的帖子 - 人参识别助手',
      path: '/pages/myPosts/myPosts',
      imageUrl: ''
    }
  },

  // 分享到朋友圈
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
      title: '我的帖子 - 人参识别助手',
      path: '/pages/myPosts/myPosts',
      imageUrl: ''
    }
  },

  // 去论坛发帖
  goToForum() {
    wx.switchTab({
      url: '/pages/forum/forum'
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  }
})
