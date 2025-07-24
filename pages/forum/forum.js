// forum.js
const app = getApp()

Page({
  data: {
    posts: [],
    userInfo: null,
    userScore: 100
  },
  
  onLoad() {
    this.getUserInfo()
    this.loadPosts()
  },
  
  onShow() {
    // 每次显示页面时重新加载帖子和积分
    this.loadPosts()
    this.getUserScore()
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
    const userScore = wx.getStorageSync('userScore') || 100
    this.setData({
      userScore: userScore
    })
  },
  
  // 加载帖子列表
  loadPosts() {
    // 从本地存储加载帖子
    const posts = wx.getStorageSync('posts') || []
    
    // 如果没有帖子，创建一些示例帖子
    if (posts.length === 0) {
      const samplePosts = [
        {
          id: 1,
          title: '分享一株野山参',
          content: '在长白山发现的一株野山参，大家看看品质如何？',
          author: '人参爱好者',
          avatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
          createTime: '2025-01-07 10:30',
          images: [],
          likes: 15,
          comments: 8,
          liked: false
        },
        {
          id: 2,
          title: '人参泡酒的正确方法',
          content: '最近想用人参泡酒，请教一下各位大神正确的泡制方法和注意事项。',
          author: '新手小白',
          avatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
          createTime: '2025-01-07 09:15',
          images: [],
          likes: 23,
          comments: 12,
          liked: false
        }
      ]
      wx.setStorageSync('posts', samplePosts)
      this.setData({
        posts: samplePosts
      })
    } else {
      this.setData({
        posts: posts
      })
    }
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
        const liked = !post.liked
        const likes = liked ? post.likes + 1 : post.likes - 1
        
        this.setData({
          [`posts[${index}].liked`]: liked,
          [`posts[${index}].likes`]: likes
        })
        
        // 更新本地存储
        const posts = this.data.posts
        wx.setStorageSync('posts', posts)
        
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
  
  // 分享帖子到微信
  sharePost(e) {
    const index = e.currentTarget.dataset.index
    const post = this.data.posts[index]
    
    wx.showActionSheet({
      itemList: ['分享给微信好友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 分享给好友
          wx.shareAppMessage({
            title: post.title,
            desc: post.content,
            path: `/pages/postDetail/postDetail?id=${post.id}`,
            success: () => {
              wx.showToast({
                title: '分享成功',
                icon: 'success'
              })
            }
          })
        } else if (res.tapIndex === 1) {
          // 分享到朋友圈 (需要在页面级别定义 onShareTimeline)
          wx.showToast({
            title: '请点击右上角分享到朋友圈',
            icon: 'none'
          })
        } else if (res.tapIndex === 2) {
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
    return {
      title: '人参识别助手 - 专业的人参识别和交流平台',
      path: '/pages/forum/forum',
      imageUrl: '' // 可以设置分享图片
    }
  },
  
  // 分享到朋友圈（页面级别的分享函数）
  onShareTimeline(res) {
    return {
      title: '人参识别助手 - 专业的人参识别和交流平台',
      path: '/pages/forum/forum',
      imageUrl: '' // 可以设置分享图片
    }
  }
})
