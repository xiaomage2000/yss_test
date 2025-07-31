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
  
  onShow() {
    // 页面显示时更新用户信息
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
            createTime: data.post.created_at,
            images: this.parseImages(data.post.images),
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
            createTime: comment.created_at
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
    // 检查用户是否已登录
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.showModal({
        title: '需要登录',
        content: '请先完善您的个人信息后再点赞',
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
      return
    }
    
    const post = this.data.post
    this.likePostAPI(post.id, !post.liked)
  },

  // 通过API点赞
  likePostAPI(postId, isLike) {
    const app = getApp()
    const userInfo = wx.getStorageSync('userInfo')
    
    if (!userInfo || !userInfo.id) {
      wx.showToast({
        title: '请先登录',
        icon: 'error'  
      })
      return
    }
    
    app.request({
      url: `/api/posts/${postId}/like`,
      method: 'POST',
      data: {
        user_id: userInfo.id, // 使用真实用户ID
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
    // 检查用户是否已登录
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.showModal({
        title: '需要登录',
        content: '请先完善您的个人信息后再评论',
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
      return
    }
    
    this.setData({
      showReplyInput: true
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
    const userInfo = wx.getStorageSync('userInfo')
    
    if (!userInfo || !userInfo.id) {
      wx.showToast({
        title: '请先登录',
        icon: 'error'
      })
      return
    }
    
    wx.showLoading({
      title: '发送中...'
    })
    
    app.request({
      url: `/api/posts/${this.data.post.id}/comments`,
      method: 'POST',
      data: {
        user_id: userInfo.id, // 使用真实用户ID
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
})
