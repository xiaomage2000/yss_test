// knowledge.js
Page({
  data: {
    knowledgeList: []
  },

  onLoad() {
    this.loadKnowledge()
  },

  // 从API获取人参知识
  loadKnowledge() {
    const app = getApp()
    
    wx.showLoading({
      title: '加载中...'
    })
    
    app.request({
      url: '/api/knowledge',
      method: 'GET',
      success: (data) => {
        wx.hideLoading()
        if (data.success && data.data) {
          const knowledgeList = data.data.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content,
            expanded: false
          }))
          
          this.setData({
            knowledgeList: knowledgeList
          })
        } else {
          wx.showToast({
            title: '获取知识内容失败',
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
  
  // 切换折叠状态
  toggleExpand(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.knowledgeList[index]
    const key = `knowledgeList[${index}].expanded`
    
    this.setData({
      [key]: !item.expanded
    })
  },
  
  // 页面分享函数
  onShareAppMessage(res) {
    return {
      title: '人参知识百科 - 人参识别助手',
      desc: '了解人参的种类、功效和使用方法',
      path: '/pages/knowledge/knowledge'
    }
  },
  
  onShareTimeline(res) {
    return {
      title: '人参知识百科 - 人参识别助手',
      path: '/pages/knowledge/knowledge'
    }
  }
})
