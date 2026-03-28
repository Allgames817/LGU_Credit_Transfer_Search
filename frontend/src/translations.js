export const translations = {
  zh: {
    title: "港中深海外交流交换课程转学分查询系统",
    subtitle: "支持按地区与合作院校、课程关键词、港中深课程代码等检索课程转换关系。本项目正在开发中，欢迎访问本项目的Github主页点亮Stars或提出建议给我们反馈！",
    feedbackBtn: "我要提建议",
    allRegions: "全部地区",
    allUniversities: "全部合作院校",
    keywordPlaceholder: "关键词（课程名/代码）",
    allFaculties: "全部归属学院",
    cuhkszCodePlaceholder: "港中深课程代码（如 CSC1001）",
    loading: "加载中...",
    noResults: "暂无匹配结果",
    pagination: {
      summary: (total, from, to) => `共 ${total} 条，显示第 ${from}–${to} 条`,
      pageOf: (p, totalPages) => `第 ${p} / ${totalPages} 页`,
      pageSize: "每页",
      prev: "上一页",
      next: "下一页"
    },
    error: "无法连接后端服务，请先启动 backend。",
    tableHeaders: {
      partnerUniversity: "合作院校",
      partnerCourse: "对方课程",
      faculty: "归属学院",
      cuhkszCourse: "港中深可认定课程",
      status: "状态"
    },
    darkModeTooltip: {
      light: "切换到深色模式",
      dark: "切换到浅色模式"
    },
    languageTooltip: "切换语言",
    feedback: {
      title: "意见与建议",
      subtitle: "欢迎告诉我们你的使用体验、问题和改进建议。",
      backBtn: "返回查询页面",
      nameLabel: "你的称呼（可选）",
      namePlaceholder: "例如：2023级 金融专业同学",
      messageLabel: "建议内容",
      submitBtn: "提交建议",
      submitting: "提交中...",
      errorEmpty: "请先输入建议内容。",
      errorSubmit: "提交失败",
      successMessage: "建议已提交，感谢反馈！"
    }
  },
  en: {
    title: "CUHK-Shenzhen Credit Transfer Search System",
    subtitle: "Search for course transfer relationships by region, partner university, course keywords, and CUHK-Shenzhen course codes. This project is under development. Welcome to visit our Github page to star or give us feedback!",
    feedbackBtn: "Feedback",
    allRegions: "All Regions",
    allUniversities: "All Partner Universities",
    keywordPlaceholder: "Keyword (Course Name/Code)",
    allFaculties: "All Faculties",
    cuhkszCodePlaceholder: "CUHK-SZ Course Code (e.g. CSC1001)",
    loading: "Loading...",
    noResults: "No matching results",
    pagination: {
      summary: (total, from, to) => `${total} total · Showing ${from}–${to}`,
      pageOf: (p, totalPages) => `Page ${p} of ${totalPages}`,
      pageSize: "Per page",
      prev: "Previous",
      next: "Next"
    },
    error: "Unable to connect to backend service. Please start the backend first.",
    tableHeaders: {
      partnerUniversity: "Partner University",
      partnerCourse: "Partner Course",
      faculty: "Faculty",
      cuhkszCourse: "CUHK-SZ Recognized Course",
      status: "Status"
    },
    darkModeTooltip: {
      light: "Switch to Dark Mode",
      dark: "Switch to Light Mode"
    },
    languageTooltip: "Switch Language",
    feedback: {
      title: "Feedback & Suggestions",
      subtitle: "Welcome to share your experience, issues, and suggestions for improvement.",
      backBtn: "Back to Search",
      nameLabel: "Your Name (Optional)",
      namePlaceholder: "e.g., Class of 2023 Finance Student",
      messageLabel: "Your Feedback",
      submitBtn: "Submit Feedback",
      submitting: "Submitting...",
      errorEmpty: "Please enter your feedback.",
      errorSubmit: "Submission failed",
      successMessage: "Feedback submitted successfully. Thank you!"
    }
  }
};
