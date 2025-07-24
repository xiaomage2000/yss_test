const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// API 连接测试
const testAPIConnection = (callback) => {
  const app = getApp()
  
  app.request({
    url: '/api/health',
    method: 'GET',
    success: (data) => {
      console.log('API连接成功:', data)
      if (callback) callback(true, 'API连接正常')
    },
    fail: (err) => {
      console.log('API连接失败:', err)
      if (callback) callback(false, 'API连接失败，使用本地模式')
    }
  })
}

// 获取API状态
const getAPIStatus = () => {
  return new Promise((resolve) => {
    testAPIConnection((success, message) => {
      resolve({
        online: success,
        message: message,
        apiBase: getApp().globalData.apiBase
      })
    })
  })
}

module.exports = {
  formatTime,
  testAPIConnection,
  getAPIStatus
}
