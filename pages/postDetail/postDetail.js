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
    const app = getApp()
    
    wx.showLoading({
      title: '加载中...'
    })
    
    app.request({
      url: `/api/posts/${postId}`,
      method: 'GET',
      success: (data) => {
        wx.hideLoading()
        console.log(data)
        if (data.success && data.post) {
          const post = {
            id: data.post.id,
            title: data.post.title,
            content: data.post.content,
            author: data.post.author_nickname || data.post.author,
            avatar: data.post.author_avatar || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
            createTime: this.formatTime(data.post.created_at),
            images: data.post.images ? JSON.parse(data.post.images) : [],
            likes: data.post.likes_count || 0,
            comments: data.post.comments_count || 0,
            liked: false // 需要根据用户状态判断
          }
          
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
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  },
  
  // 加载评论
  loadComments(postId) {
    const app = getApp()
    
    app.request({
      url: `/api/posts/${postId}/comments`,
      method: 'GET',
      success: (data) => {
        if (data.success && data.data) {
          const comments = data.data.map(comment => ({
            id: comment.id,
            postId: comment.post_id,
            content: comment.content,
            author: comment.user_nickname || comment.author,
            avatar: comment.user_avatar || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
            createTime: this.formatTime(comment.created_at)
          }))
          
          this.setData({
            comments: comments
          })
        }
      },
      fail: (err) => {
        console.error('获取评论失败:', err)
      }
    })
  },
  
  // 点赞帖子
  likePost() {
    const app = getApp()
    app.checkUserLogin((isLoggedIn, userInfo) => {
      if (isLoggedIn) {
        const post = this.data.post
        this.likePostAPI(post.id, !post.liked)
      } else {
        wx.showToast({
          title: '未登录，无法点赞',
          icon: 'error'
        })
      }
    })
  },

  // 通过API点赞
  likePostAPI(postId, isLike) {
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
          const post = this.data.post
          const likes = isLike ? post.likes + 1 : post.likes - 1
          
          post.liked = isLike
          post.likes = likes
          
          this.setData({
            post: post
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
    
    this.submitCommentAPI()
  },

  // 通过API提交评论
  submitCommentAPI() {
    const app = getApp()
    
    wx.showLoading({
      title: '发送中...'
    })
    
    app.request({
      url: `/api/posts/${this.data.post.id}/comments`,
      method: 'POST',
      data: {
        user_id: 1, // 模拟用户ID
        content: this.data.replyText
      },
      success: (data) => {
        wx.hideLoading()
        if (data.success) {
          // 重新加载评论
          this.loadComments(this.data.post.id)
          
          // 更新帖子的评论数
          const post = this.data.post
          post.comments += 1
          this.setData({
            post: post,
            replyText: '',
            showReplyInput: false
          })
          
          wx.showToast({
            title: '回复成功',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: data.error || '回复失败',
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

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return ''
    
    // 处理字符串时间戳
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  }
})
