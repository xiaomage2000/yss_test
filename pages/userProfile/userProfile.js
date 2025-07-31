Page({
  data: {
    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    nickname: '',
    canSubmit: false,
    loginCode: ''
  },

  onLoad(options) {
    // 获取登录code
    const loginCode = options.code || ''
    this.setData({
      loginCode: loginCode
    })
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      avatarUrl: avatarUrl
    })
    this.checkCanSubmit()
  },

  // 昵称输入
  onNicknameInput(e) {
    const nickname = e.detail.value.trim()
    this.setData({
      nickname: nickname
    })
    this.checkCanSubmit()
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const canSubmit = this.data.nickname.length > 0
    this.setData({
      canSubmit: canSubmit
    })
  },

  // 提交表单
  onSubmit(e) {
    if (!this.data.canSubmit) {
      return
    }

    const { nickname } = e.detail.value
    
    if (!nickname || nickname.trim().length === 0) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'error'
      })
      return
    }

    wx.showLoading({
      title: '保存中...'
    })

    // 先上传头像（如果是用户选择的）
    if (this.data.avatarUrl.startsWith('http://tmp/') || this.data.avatarUrl.includes('wxfile://')) {
      this.uploadAvatarAndLogin(nickname.trim())
    } else {
      this.performLogin(nickname.trim(), this.data.avatarUrl)
    }
  },

  // 上传头像并登录
  uploadAvatarAndLogin(nickname) {
    const app = getApp()
    
    wx.uploadFile({
      url: `${app.globalData.apiBase}/api/upload/image`,
      filePath: this.data.avatarUrl,
      name: 'image',
      header: {
        'Content-Type': 'multipart/form-data'
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.success) {
            const avatarUrl = `${app.globalData.apiBase}${data.url}`
            this.performLogin(nickname, avatarUrl)
          } else {
            wx.hideLoading()
            wx.showToast({
              title: '头像上传失败',
              icon: 'error'
            })
          }
        } catch (e) {
          wx.hideLoading()
          wx.showToast({
            title: '头像上传失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('头像上传失败:', err)
        // 使用默认头像继续登录
        this.performLogin(nickname, this.data.avatarUrl)
      }
    })
  },

  // 执行登录
  performLogin(nickname, avatarUrl) {
    const app = getApp()
    
    const userInfo = {
      nickName: nickname,
      avatarUrl: avatarUrl
    }
    
    // 调用后端登录接口
    app.request({
      url: '/api/user/login',
      method: 'POST',
      data: {
        code: this.data.loginCode,
        userInfo: userInfo
      },
      success: (res) => {
        wx.hideLoading()
        
        if (res.success) {
          const userData = res.user
          const finalUserInfo = {
            id: userData.id,
            nickName: userData.nickname || nickname,
            avatarUrl: userData.avatar_url || avatarUrl
          }
          
          // 保存用户信息
          wx.setStorageSync('userInfo', finalUserInfo)
          wx.setStorageSync('userScore', userData.score || 100)
          app.globalData.userInfo = finalUserInfo
          app.globalData.hasUserInfo = true
          
          // 通知所有页面更新用户信息
          if (typeof app.notifyUserInfoUpdate === 'function') {
            app.notifyUserInfoUpdate()
          }
          
          wx.showToast({
            title: '设置成功',
            icon: 'success'
          })
          
          // 跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }, 1500)
        } else {
          wx.showToast({
            title: res.error || '登录失败',
            icon: 'error'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('登录接口调用失败:', err)
        wx.showToast({
          title: '登录失败',
          icon: 'error'
        })
      }
    })
  },

  // 重置表单
  onReset() {
    this.setData({
      nickname: '',
      canSubmit: false
    })
  }
})
