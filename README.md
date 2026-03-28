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
- 学院分类：SDS、SSE、SME等学院分类
- 课程代码查询：精确匹配港中深课程代码

### 用户体验
- 深色模式：深色主题，平滑过渡动画
- 双语支持：中英文界面切换（数据保持原样）
- 响应式设计：适配桌面和移动设备
- 实时搜索：输入即搜，无需点击按钮

### 管理功能
- 课程管理：新增、编辑、删除课程映射记录
- 建议管理：查看、筛选、导出用户反馈
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

> PowerShell 若拦截 `npm.ps1`，安装依赖与启动可改用：`npm.cmd run install:all`、`npm.cmd run dev`。

## Railway 部署与用户建议持久化

仓库根目录的 `railway.toml` 已配置构建与启动命令。要让 **用户建议**（`/feedback` → `suggestions.json`）在 **重新部署 / 重启** 后仍保留，需要为该服务挂载 **Volume**，后端会自动使用 Railway 提供的环境变量 **`RAILWAY_VOLUME_MOUNT_PATH`**（无需手写该变量）。

### 操作步骤（Railway 控制台）

1. 打开你的 **Project**，点选部署本应用的 **Service**。
2. 在画布上 **右键** 或使用 **⌘K / Ctrl+K** 命令面板，选择 **New Volume**（或 **Add Volume**），把 Volume **关联到当前 Service**。
3. 在 Volume / Service 设置里将 **Mount Path** 设为 **`/data`**（也可自定，见下）。
4. **Redeploy** 一次服务。启动日志中应出现：  
   `[suggestions] storage file: /data/suggestions.json (dir from RAILWAY_VOLUME_MOUNT_PATH)`  
   若仍为 `backend/src/data`，说明当前运行环境未挂载卷或未读到变量。
5. （可选）在 **Variables** 中手动添加 **`SUGGESTIONS_DATA_DIR`**，值为与挂载路径一致的绝对路径（例如 `/data`）。**若设置此项，将优先于 `RAILWAY_VOLUME_MOUNT_PATH`。**
6. 若写入卷时报权限错误，可在 Variables 中设置 **`RAILWAY_RUN_UID=0`**（参见 [Railway Volumes](https://docs.railway.com/guides/volumes)）。

### 环境变量小结

| 变量 | 说明 |
|------|------|
| `ADMIN_TOKEN` | 管理员令牌（必填于生产） |
| `RAILWAY_VOLUME_MOUNT_PATH` | Railway **挂卷后自动注入**，一般无需手动添加 |
| `SUGGESTIONS_DATA_DIR` | 手动指定建议文件所在**目录**（非文件路径），与挂载路径一致即可；优先级最高 |
| `RAILWAY_RUN_UID` | 非 root 镜像写卷困难时可设为 `0` |

建议文件最终路径为：**`<上述目录>/suggestions.json`**。

### 若部署显示 Crashed、日志里有 `npm error command failed`

- `npm warn config production` 只是 **npm 提示**，不是业务崩溃原因。
- 用 **`npm start`** 时，平台在 **重部署 / 换实例** 时会给进程发 **SIGTERM**，npm 常会误报 `command failed`，易被误判为崩溃。本项目 `railway.toml` 已改为 **`node backend/src/server.js`** 直接启动，减少这类噪音。
- 请确认 Service 的 **Root Directory 为空（仓库根）**；若你填了 `backend`，须把启动命令改成 `NODE_ENV=production node src/server.js`，否则路径会对不上。
- 后端已监听 **`0.0.0.0`**，便于 Railway 健康检查访问容器内端口。

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
│   │   │   ├── courses.js     # 课程数据
│   │   │   └── suggestions.json # 用户建议数据
│   │   └── server.js          # Express 服务器
│   └── package.json
├── frontend/                   # 前端代码
│   ├── src/
│   │   ├── Admin.jsx          # 管理员页面
│   │   ├── AdminSuggestions.jsx # 建议管理页面
│   │   ├── Query.jsx          # 查询页面
│   │   ├── Feedback.jsx       # 用户反馈页面
│   │   ├── translations.js    # 多语言配置
│   │   ├── universityRegions.js # 地区映射
│   │   └── styles.css         # 全局样式
│   └── package.json
└── package.json               # 根配置文件
```

## 后端 API

### 公开接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/universities` | 获取合作院校列表 |
| GET | `/api/courses` | 查询课程（支持多参数筛选） |
| POST | `/api/suggestions` | 提交用户建议 |

### 管理员接口（需要令牌）

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/courses` | 新增课程映射 |
| PUT | `/api/courses/:id` | 编辑课程映射 |
| DELETE | `/api/courses/:id` | 删除课程映射 |
| GET | `/api/suggestions` | 查看所有建议 |
| DELETE | `/api/suggestions/:id` | 删除单条建议 |
| DELETE | `/api/suggestions` | 清空所有建议 |

### 查询参数

`GET /api/courses` 支持以下查询参数：

- `university` - 合作院校名称
- `keyword` - 课程关键词（匹配课程名称或代码）
- `cuhkszCourseCode` - 港中深课程代码
- `faculty` - 归属学院（SDS/SSE/SME等）
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

编辑 `backend/src/data/courses.js`，添加新的课程映射记录：

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

新增院校时，需要在 `frontend/src/universityRegions.js` 中添加地区映射：

```javascript
const UNIVERSITY_REGION = {
  "Stanford University": "americas",
  "University of Oxford": "europe",
  // 添加更多...
};
```

支持的地区：`asia`、`europe`、`americas`、`oceania`、`other`

### 建议数据管理

- 默认文件：`backend/src/data/suggestions.json`。生产环境可设置 **`SUGGESTIONS_DATA_DIR`**，或在 Railway 挂载 Volume 后使用自动注入的 **`RAILWAY_VOLUME_MOUNT_PATH`**（详见上文「Railway 部署与用户建议持久化」）；实际路径以启动日志 `[suggestions] storage file: ...` 为准。
- 后端对建议采用**串行写入**与**原子保存**（临时文件再替换），多人同时提交不易丢数据；`id` 为递增数字。
- 管理方式：
  1. 网页（推荐）：`/admin/suggestions`，令牌登录后可筛选、删除、导出 CSV
  2. 手动清空：将 `suggestions.json` 内容改为 `[]` 并保存

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
