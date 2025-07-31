// forum.js
const app = getApp()

Page({
  data: {
    posts: [],
    userInfo: null,
    userScore: 100,
    myPostsCount: 0,
    totalPostsCount: 0, // 帖子总数
    currentPage: 1,
    pageSize: 5,
    hasMore: true,
    loading: false
  },
  
  onLoad() {
    this.getUserInfo()
    this.loadPosts()
    this.loadPostsStats() // 加载帖子统计
  },
  
  onShow() {
    // 每次显示页面时重新加载帖子和积分
    this.loadPosts()
    this.getUserScore()
    this.updateMyPostsCount()
    this.loadPostsStats() // 加载帖子统计
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
  
  // 加载帖子列表
  loadPosts(refresh = true) {
    if (refresh) {
      // 刷新时重置分页状态
      this.setData({
        currentPage: 1,
        posts: [],
        hasMore: true
      })
    }
    
    if (this.data.loading || !this.data.hasMore) {
      return
    }
    
    this.loadPostsFromAPI()
  },

  // 从API获取帖子
  loadPostsFromAPI() {
    const app = getApp()
    
    this.setData({ loading: true })
    
    if (this.data.currentPage === 1) {
      wx.showLoading({
        title: '加载中...'
      })
    }
    
    app.request({
      url: '/api/posts',
      method: 'GET',
      data: {
        page: this.data.currentPage,
        limit: this.data.pageSize
      },
      success: (data) => {
        if (this.data.currentPage === 1) {
          wx.hideLoading()
        }
        this.setData({ loading: false })
        if (data.success && data.data) {
          // 转换后端数据格式为前端需要的格式
          const newPosts = data.data.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            author: post.author_nickname || post.author,
            avatar: post.author_avatar || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
            createTime: post.created_at,
            images: this.parseImages(post.images),
            likes: post.likes_count || 0,
            comments: post.comments_count || 0,
            liked: false // 这里需要根据用户状态判断
          }))
          
          const currentPosts = this.data.currentPage === 1 ? [] : this.data.posts
          const allPosts = [...currentPosts, ...newPosts]
          
          // 检查是否还有更多数据
          const hasMore = data.pagination ? this.data.currentPage < data.pagination.pages : false
          
          this.setData({
            posts: allPosts,
            currentPage: this.data.currentPage + 1,
            hasMore: hasMore
          })
          
          // 帖子加载完成后更新我的帖子数量
          this.updateMyPostsCount()
          
          // 同时保存到本地存储作为备份
          wx.setStorageSync('posts', allPosts)
        } else {
          wx.showToast({
            title: '获取帖子失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        if (this.data.currentPage === 1) {
          wx.hideLoading()
        }
        this.setData({ loading: false })
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        })
      }
    })
  },

  // 发布新帖子
  createPost() {
    // 检查用户是否已登录
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.showModal({
        title: '需要登录',
        content: '请先完善您的个人信息后再发布帖子',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 获取登录凭证后跳转到用户信息填写页面
            wx.login({
              success: (loginRes) => {
                if (loginRes.code) {
                  wx.navigateTo({
                    url: `/pages/userProfile/userProfile?code=${loginRes.code}`
                  })
                }
              }
            })
          }
        }
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/createPost/createPost'
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
    // 检查用户是否已登录
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'error'
      })
      return
    }
    
    const index = e.currentTarget.dataset.index
    const post = this.data.posts[index]
    
    // 调用API点赞
    this.likePostAPI(post.id, index, !post.liked)
  },

  // 通过API点赞
  likePostAPI(postId, index, isLike) {
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
    const userInfo = wx.getStorageSync('userInfo')
    
    if (!userInfo || !userInfo.id) {
      this.setData({
        myPostsCount: 0
      })
      return
    }
    
    // 调用API获取用户帖子数量
    app.request({
      url: '/api/user/posts',
      method: 'GET',
      data: { 
        user_id: userInfo.id,
        page: 1, 
        limit: 1 
      }, // 只需要获取总数
      success: (res) => {
        if (res.success && res.pagination) {
          this.setData({
            myPostsCount: res.pagination.total
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
  },
  
  // 查看我的帖子
  viewMyPosts() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'error'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/myPosts/myPosts'
    })
  },

  // 页面触底事件
  onReachBottom() {
    console.log('触底加载更多')
    // 检查是否还有更多数据且当前没有在加载
    if (this.data.hasMore && !this.data.loading) {
      this.loadPosts(false) // false表示不刷新，追加数据
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新')
    this.loadPosts(true) // true表示刷新
    wx.stopPullDownRefresh()
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

  // 获取帖子统计信息
  loadPostsStats() {
    const app = getApp()
    
    app.request({
      url: '/api/posts/stats',
      method: 'GET',
      success: (data) => {
        if (data.success && data.data) {
          this.setData({
            totalPostsCount: data.data.total_posts
          })
        }
      },
      fail: (err) => {
        console.log('获取帖子统计失败:', err)
        // 失败时使用当前帖子数量作为备选
        this.setData({
          totalPostsCount: this.data.posts.length
        })
      }
    })
  },
})
