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
    announcement: {
      title: "公告：海外交流交换转学分查询网站上线",
      body: [
        "正在准备海外交流交换/暑课的同学看过来！！！",
        "你们是否遇到过“如何确认外方院校的课程在港中深能够对应转换为哪些课程”这样的难题？翻查 course description、比对 syllabus、反复与学院、教务处及 OAL 沟通确认，是许多同学在交换前后都经历过的繁琐流程。",
        "针对这一需求，我们搭建了一个课程对应关系查询网站：",
        "该网站的数据来源于 SSE、SDS、SME 三个学院的教务处转学分记录文件，将往届同学成功转换学分的课程对应案例进行系统整理，形成可检索的数据库。在交换前直接检索对方院校及课程名称，即可查看该门课程在港中深过往被认定为何种课程、归属哪个学分类别，为选课提供参考依据。",
        "目前数据主要覆盖 SSE、SDS、SME 三个学院，GE（通识课程）部分暂时仅收录与香港中文大学暑课相关的对应案例。需要说明的是，网站数据基于学院过往转学分记录整理，仅供参考，最终学分认定结果请以所在学院及 OAL 的审批为准。如有不确定或网站中未收录的课程，建议通过邮件向教务处进行具体确认。",
        "交换期间选课时有据可依，交换回校提交转学分申请时也可参照网站中的成功案例，有助于减少与教务部门之间的沟通成本。若你已有经过验证的课程对应关系，也非常欢迎大家在网站中补充提交，帮助后续同学少走弯路。",
        "希望能为每一位参与海外交流交换的同学，在项目选择与课程规划上提供一份切实可行的参考！"
      ],
      close: "关闭"
    },
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
    announcement: {
      title: "Announcement: Credit Transfer Search is Live",
      body: [
        "Data on this site is compiled from historical credit transfer records maintained by the Academic Affairs Offices of SSE, SDS, and SME. We systematically organize successful credit transfer cases from previous cohorts into a searchable database. Before your exchange, you can search by partner university and course title to see how the course has been recognized at CUHK-Shenzhen in the past and which credit category it falls under, as a reference for course planning.",
        "At present, the dataset mainly covers SSE, SDS, and SME. For GE (General Education) courses, we currently only include mapping cases related to CUHK summer courses. Please note that the information on this site is organized from past records and is for reference only. Final credit recognition is subject to the approval of your School/Faculty and OAL. If you are unsure or the course is not included on the site, please email the Academic Affairs Office for confirmation.",
        "During course selection, these records can serve as evidence-based reference; when you return and submit your credit transfer application, you may also refer to successful cases on the site, which can help reduce communication overhead with administrative offices. If you already have verified course mappings, you are welcome to submit them through the website to help future students avoid unnecessary detours.",
        "We hope this provides a practical and reliable reference for every student participating in overseas exchange—supporting better program choices and course planning."
      ],
      close: "Close"
    },
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
