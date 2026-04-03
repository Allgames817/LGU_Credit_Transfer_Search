# 港中深海外交流交换课程转学分查询系统

一个现代化的前后端分离系统，用于查询海外交流课程与港中深课程的学分转换关系。

[![GitHub Stars](https://img.shields.io/github/stars/Allgames817/LGU_Credit_Transfer_Search?style=social)](https://github.com/Allgames817/LGU_Credit_Transfer_Search)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

## 功能特性

### 查询功能
- 地区筛选：按亚洲、欧洲、美洲、大洋洲等地区快速定位
- 院校筛选：支持 80+ 所合作院校
- 关键词搜索：课程名称、课程代码智能匹配
- 学院分类：SDS、SSE、SME 等学院分类
- 课程代码查询：精确匹配港中深课程代码
- 分页与跳页：列表分页，支持输入页码跳转

### 用户体验
- 深色模式：深色主题，平滑过渡动画
- 双语支持：中英文界面切换（数据保持原样）
- 响应式设计：适配桌面和移动设备
- 实时搜索：输入即搜，无需点击按钮

### 用户自助
- **提交转学分映射**：访问 `/submit-transfer`，填写合作校与港中深课程等信息；数据写入待审核队列，由管理员在审核页处理

### 管理功能
- **课程维护**（`/admin/courses`）：新增、编辑、删除课程映射记录；分页与跳页；可选维护首页公告（同页或 `/admin/announcement`）
- **转学分审核**（`/admin/reviews`）：查看待审与历史提交；**通过**则写入 `courses.js`；**拒绝**仅更新状态；**删除**从审核列表移除该条记录（**不会**自动撤销已写入课程库的数据，需仍在课程维护中手动删课）
- **建议管理**（`/admin/suggestions`）：查看、筛选、导出用户反馈
- 权限控制：管理员令牌保护敏感操作
- 数据导出：支持 CSV 格式导出

## 快速开始

### 环境要求

- Node.js >= 18
- npm 或 yarn

### 安装步骤

1. 克隆项目

```bash
git clone https://github.com/Allgames817/LGU_Credit_Transfer_Search.git
cd LGU_Credit_Transfer_Search
```

2. 安装依赖

```bash
npm run install:all
```

3. 启动开发服务器

```bash
npm run dev
```

> 注意：`npm run dev` 会自动清理占用 4000（后端）和 5173（前端）端口的旧进程。

4. 访问应用
- 前端地址：http://localhost:5173
- 后端地址：http://localhost:4000

## 技术栈

### 前端
- React 18 - 现代化 UI 框架
- Vite - 极速构建工具
- CSS3 - 原生样式，支持深色模式

### 后端
- Node.js - JavaScript 运行时
- Express - 轻量级 Web 框架
- 内存数据存储 - 快速原型开发

## 项目结构

```text
LGU_Credit_Transfer_Search/
├── backend/                    # 后端代码
│   ├── src/
│   │   ├── data/
│   │   │   ├── courses.js              # 课程映射（主数据）
│   │   │   ├── suggestions.json        # 用户建议
│   │   │   ├── announcement.json       # 首页公告
│   │   │   └── course_submissions.json # 用户提交的转学分待审队列
│   │   └── server.js                   # Express 服务
│   └── package.json
├── frontend/                   # 前端代码
│   ├── src/
│   │   ├── Query.jsx                   # 查询页
│   │   ├── SubmitTransfer.jsx          # 自助提交转学分
│   │   ├── Admin.jsx                   # 课程维护 / 公告（路由 /admin/courses、/admin/announcement）
│   │   ├── AdminCourseReviews.jsx      # 转学分审核 /admin/reviews
│   │   ├── AdminSuggestions.jsx        # 建议管理
│   │   ├── Feedback.jsx                # 用户反馈
│   │   ├── translations.js
│   │   ├── universityRegions.js        # 地区与校名映射
│   │   └── styles.css
│   └── package.json
└── package.json               # 根配置文件
```

## 前端路由一览

| 路径 | 说明 |
|------|------|
| `/` | 公开查询 |
| `/submit-transfer` | 自助提交转学分（公开） |
| `/feedback` | 用户反馈（公开） |
| `/admin` | 重定向至 `/admin/courses` |
| `/admin/courses` | 课程维护（需令牌） |
| `/admin/announcement` | 公告编辑（需令牌） |
| `/admin/reviews` | 转学分提交审核（需令牌） |
| `/admin/suggestions` | 建议管理（需令牌） |

## 后端 API

### 公开接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/universities` | 获取合作院校列表 |
| GET | `/api/university-regions` | 课程中显式 `partnerRegion` 的校名→地区（供前台筛选） |
| GET | `/api/courses` | 查询课程（支持多参数筛选） |
| GET | `/api/courses/:id` | 单条课程 |
| GET | `/api/announcement` | 首页公告 |
| POST | `/api/suggestions` | 提交用户建议 |
| POST | `/api/course-submissions` | 提交一条转学分映射（进入审核队列） |

### 管理员接口（需要令牌）

| 方法 | 路径 | 描述 |
|------|------|------|
| PUT | `/api/announcement` | 保存公告 |
| POST | `/api/courses` | 新增课程映射 |
| PUT | `/api/courses/:id` | 编辑课程映射 |
| DELETE | `/api/courses/:id` | 删除课程映射 |
| GET | `/api/suggestions` | 查看所有建议 |
| DELETE | `/api/suggestions/:id` | 删除单条建议 |
| DELETE | `/api/suggestions` | 清空所有建议 |
| GET | `/api/course-submissions` | 列出所有转学分提交 |
| POST | `/api/course-submissions/:id/approve` | 通过审核并写入课程 |
| POST | `/api/course-submissions/:id/reject` | 拒绝（保留记录，更新状态） |
| DELETE | `/api/course-submissions/:id` | 从队列中删除该条记录 |

### 查询参数

`GET /api/courses` 支持以下查询参数：

- `university` - 合作院校名称
- `keyword` - 课程关键词（匹配课程名称或代码）
- `cuhkszCourseCode` - 港中深课程代码
- `faculty` - 归属学院（SDS/SSE/SME 等）
- `status` - 状态（approved/pending）

示例：

```bash
GET /api/courses?university=Stanford%20University&faculty=SSE
```

## 权限配置

### 管理员令牌

后端写操作需要管理员令牌验证。配置方式：

```bash
export ADMIN_TOKEN=your-secret-token
```

默认令牌为 `dev-admin-token`，生产环境请务必修改。

### 前端页面

- 查询页面：`/` - 公开访问
- 反馈页面：`/feedback` - 公开访问
- 管理后台：`/admin` - 需要令牌
- 建议管理：`/admin/suggestions` - 需要令牌

## 数据管理

### 添加课程数据

- **推荐**：在 **`/admin/courses`** 录入；保存后会写回 `backend/src/data/courses.js`。可选字段 **`partnerRegion`**（`asia` / `europe` / `americas` / `oceania` / `other`）会一并写入，供前台地区筛选并补充 `universityRegions.js` 内置表。
- **手工**：直接编辑 `courses.js`，单条记录示例：

```javascript
{
  id: 1,
  partnerUniversity: "Stanford University",
  partnerCourseCode: "CS106A",
  partnerCourseName: "Programming Methodology",
  partnerCredits: 3,
  cuhkszCourseCode: "CSC1001",
  cuhkszCourseName: "Introduction to Computer Science",
  cuhkszCredits: 3,
  faculty: "SSE",
  status: "approved"
}
```

### 地区映射维护

新增院校时，可在 `frontend/src/universityRegions.js` 中补充地区映射；若已在后台为课程填写 `partnerRegion`，也会参与地区筛选。

支持的地区：`asia`、`europe`、`americas`、`oceania`、`other`

### 建议、公告与转学分提交（JSON 文件路径）

以下文件默认在 `backend/src/data/`：

- `suggestions.json`
- `announcement.json`
- `course_submissions.json`

若设置环境变量 **`SUGGESTIONS_DATA_DIR`** 或云平台注入的 **`RAILWAY_VOLUME_MOUNT_PATH`**，则上述三个文件会写到**同一目录**下（与 `suggestions.json` 规则一致），便于挂卷持久化。

实际路径以启动日志为准：

- `[suggestions] storage file: ...`
- `[course-submissions] storage file: ...`

写入方式：串行队列 + 原子写入（临时文件再替换），减少并发覆盖。

### 建议数据管理

- **管理**：网页 `/admin/suggestions`（令牌）支持筛选、删除、导出 CSV；或手动将 `suggestions.json` 改为 `[]`。

## 多语言支持

系统支持中英文切换，翻译配置位于 `frontend/src/translations.js`。

添加新的翻译：

```javascript
export const translations = {
  zh: { newKey: "中文文本" },
  en: { newKey: "English Text" }
};
```

## 部署

### 构建生产版本

```bash
npm run build
```

构建后的文件会复制到 `backend/public/`，可直接部署后端。

### 生产环境启动

```bash
npm run start:prod
```

生产环境请设置 **`ADMIN_TOKEN`**，并视需要设置 **`SUGGESTIONS_DATA_DIR`** 或挂卷路径，保证 JSON 数据与课程文件可写、可持久化。

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 问题反馈

遇到问题？请通过以下方式反馈：

- Bug：提交 [GitHub Issue](https://github.com/Allgames817/LGU_Credit_Transfer_Search/issues)
- 建议/Feedback：使用应用内"我要提建议"功能

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件
