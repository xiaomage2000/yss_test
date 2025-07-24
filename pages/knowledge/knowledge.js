// knowledge.js
Page({
  data: {
    knowledgeList: [
      {
        id: 1,
        title: '人参的基本认识',
        expanded: false,
        content: '人参是多年生草本植物，素有"百草之王"的美誉。人参主要分布在中国东北、朝鲜、韩国、日本、俄罗斯东部等地区。人参具有大补元气、复脉固脱、补脾益肺、生津止渴、安神益智等功效。'
      },
      {
        id: 2,
        title: '人参的分类',
        expanded: false,
        content: '按生长环境分类：\n1. 野山参：在自然状态下野生的人参\n2. 移山参：把野生参幼苗移植到人工环境下栽培\n3. 园参：人工种植的人参\n4. 林下参：在森林环境下人工播种的人参\n\n按加工方法分类：\n1. 鲜参：新鲜人参\n2. 白参：鲜参经过晾晒或烘干制成\n3. 红参：鲜参经过蒸制后干燥制成'
      },
      {
        id: 3,
        title: '原参与林下山参的区别',
        expanded: false,
        content: '原参（园参）：\n- 人工种植在田地里\n- 生长环境相对单一\n- 形状较规整，参须较少\n- 营养积累相对较快\n- 价格相对便宜\n\n林下山参：\n- 在自然森林环境下生长\n- 生长环境复杂多样\n- 形状不规则，参须丰富\n- 营养积累缓慢但更全面\n- 价格较高，营养价值更佳'
      },
      {
        id: 4,
        title: '人参年份的判断',
        expanded: false,
        content: '判断人参年份的方法：\n1. 看芦头：年份越长，芦头越粗大\n2. 看纹理：老参表面皱纹深而密\n3. 看重量：同等大小下，年份长的更重\n4. 看参须：老参的参须更细更长\n5. 看质地：年份长的人参质地更坚硬\n\n一般来说：\n- 3-6年：嫩参，适合日常保健\n- 7-15年：中等年份，药效较好\n- 15年以上：老参，药效最佳'
      },
      {
        id: 5,
        title: '人参的食用方法',
        expanded: false,
        content: '常见食用方法：\n1. 炖汤：与鸡肉、瘦肉等一起炖煮\n2. 泡酒：人参酒具有很好的滋补效果\n3. 泡茶：切片后用开水冲泡\n4. 研粉：打成粉末冲服或胶囊服用\n5. 直接嚼服：每次1-2克\n\n注意事项：\n- 不宜与萝卜、茶叶同服\n- 感冒发热时暂停服用\n- 孕妇、儿童应在医师指导下使用'
      },
      {
        id: 6,
        title: '人参的保存方法',
        expanded: false,
        content: '鲜参保存：\n- 用湿润的沙土埋藏\n- 放入冰箱冷藏\n- 用保鲜膜包好避免失水\n\n干参保存：\n- 密封保存，防潮防虫\n- 避免阳光直射\n- 可用木盒或铁盒保存\n- 适当放入干燥剂\n\n注意：人参怕热、怕湿、怕虫蛀，保存环境要干燥阴凉。'
      }
    ]
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
