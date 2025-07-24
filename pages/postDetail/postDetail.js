// postDetail.js
const app = getApp()

Page({
  data: {
    post: null,
    comments: [],
    replyText: '',
    showReplyInput: false,
    userInfo: null
  },
  
  onLoad(options) {
    const postId = options.id
    this.loadPost(postId)
    this.loadComments(postId)
    this.getUserInfo()
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
  
  // 加载帖子详情
  loadPost(postId) {
    const posts = wx.getStorageSync('posts') || []
    const post = posts.find(p => p.id == postId)
    if (post) {
      this.setData({
        post: post
      })
    } else {
      wx.showToast({
        title: '帖子不存在',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },
  
  // 加载评论
  loadComments(postId) {
    const comments = wx.getStorageSync('comments') || []
    const postComments = comments.filter(c => c.postId == postId)
    this.setData({
      comments: postComments
    })
  },
  
  // 点赞帖子
  likePost() {
    const app = getApp()
    app.checkUserLogin((isLoggedIn, userInfo) => {
      if (isLoggedIn) {
        const post = this.data.post
        const liked = !post.liked
        const likes = liked ? post.likes + 1 : post.likes - 1
        
        post.liked = liked
        post.likes = likes
        
        this.setData({
          post: post
        })
        
        // 更新本地存储
        const posts = wx.getStorageSync('posts') || []
        const index = posts.findIndex(p => p.id === post.id)
        if (index !== -1) {
          posts[index] = post
          wx.setStorageSync('posts', posts)
        }
        
        wx.showToast({
          title: liked ? '点赞成功' : '取消点赞',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '未登录，无法点赞',
          icon: 'error'
        })
      }
    })
  },
  
  // 显示回复输入框
  showReply() {
    const app = getApp()
    app.checkUserLogin((isLoggedIn, userInfo) => {
      if (isLoggedIn) {
        this.setData({
          showReplyInput: true
        })
      } else {
        wx.showToast({
          title: '未登录，无法回复',
          icon: 'error'
        })
      }
    })
  },
  
  // 隐藏回复输入框
  hideReply() {
    this.setData({
      showReplyInput: false,
      replyText: ''
    })
  },
  
  // 输入回复内容
  onReplyInput(e) {
    this.setData({
      replyText: e.detail.value
    })
  },
  
  // 发送回复
  sendReply() {
    if (!this.data.replyText.trim()) {
      wx.showToast({
        title: '请输入回复内容',
        icon: 'error'
      })
      return
    }
    
    const newComment = {
      id: Date.now(),
      postId: this.data.post.id,
      content: this.data.replyText,
      author: this.data.userInfo.nickName,
      avatar: this.data.userInfo.avatarUrl,
      createTime: this.formatTime(new Date())
    }
    
    // 保存到本地存储
    const comments = wx.getStorageSync('comments') || []
    comments.push(newComment)
    wx.setStorageSync('comments', comments)
    
    // 更新帖子的评论数
    const posts = wx.getStorageSync('posts') || []
    const postIndex = posts.findIndex(p => p.id === this.data.post.id)
    if (postIndex !== -1) {
      posts[postIndex].comments += 1
      wx.setStorageSync('posts', posts)
      
      this.setData({
        'post.comments': posts[postIndex].comments
      })
    }
    
    // 更新页面数据
    this.setData({
      comments: [...this.data.comments, newComment],
      replyText: '',
      showReplyInput: false
    })
    
    wx.showToast({
      title: '回复成功',
      icon: 'success'
    })
  },
  
  // 分享帖子
  sharePost() {
    const post = this.data.post
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
  
  // 页面分享函数
  onShareAppMessage(res) {
    const post = this.sharePostData || this.data.post
    if (post) {
      return {
        title: post.title,
        desc: post.content,
        path: `/pages/postDetail/postDetail?id=${post.id}`,
        imageUrl: post.images && post.images.length > 0 ? post.images[0] : ''
      }
    }
    return {
      title: '人参识别助手',
      desc: '专业的人参识别和交流平台',
      path: '/pages/forum/forum'
    }
  },
  
  onShareTimeline(res) {
    const post = this.sharePostData || this.data.post
    if (post) {
      return {
        title: `${post.title} - 人参识别助手`,
        path: `/pages/postDetail/postDetail?id=${post.id}`,
        imageUrl: post.images && post.images.length > 0 ? post.images[0] : ''
      }
    }
    return {
      title: '人参识别助手 - 专业的人参识别和交流平台',
      path: '/pages/forum/forum'
    }
  },
  
  // 预览图片
  previewImage(e) {
    const src = e.currentTarget.dataset.src
    const images = this.data.post.images || []
    
    wx.previewImage({
      current: src,
      urls: images
    })
  },
  formatTime(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }
})
