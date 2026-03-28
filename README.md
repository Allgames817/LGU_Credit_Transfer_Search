# 港中深海外交流交换课程转学分查询系统

一个前后端分离的示例系统，用于查询海外交流课程与港中深课程的学分转换关系。

## 技术栈

- 前端：React + Vite
- 后端：Node.js + Express
- 数据：内存示例数据（`backend/src/data/courses.js`）

## 目录结构

```text
.
├─ backend
│  └─ src
│     ├─ data/courses.js
│     └─ server.js
├─ frontend
│  └─ src
│     ├─ App.jsx
│     ├─ main.jsx
│     └─ styles.css
└─ package.json
```

## 快速启动

1. 安装依赖

```bash
npm run install:all
# 若 PowerShell 报 npm.ps1 被拦截，请改用：
npm.cmd run install:all
```

2. 同时启动前后端

```bash
npm run dev
# 若 PowerShell 报 npm.ps1 被拦截，请改用：
npm.cmd run dev
```

说明：`npm run dev` 会先自动清理占用 `4000`（后端）和 `5173`（前端）端口的旧进程，减少端口冲突报错。

3. 打开页面

- 前端地址：<http://localhost:5173>
- 后端地址：<http://localhost:4000>

## 后端 API

- `GET /api/health`：健康检查
- `GET /api/universities`：合作院校列表
- `GET /api/courses`：课程查询（支持参数）
  - `university`
  - `keyword`
  - `cuhkszCourseCode`
  - `status`
- `POST /api/courses`：新增课程映射记录
- `PUT /api/courses/:id`：编辑课程映射记录
- `DELETE /api/courses/:id`：删除课程映射记录
- `POST /api/suggestions`：用户提交建议（公开）
- `GET /api/suggestions`：管理员查看建议（需令牌）
- `DELETE /api/suggestions/:id`：管理员删除单条建议（需令牌）
- `DELETE /api/suggestions`：管理员清空全部建议（需令牌）

## 权限与后台录入

- 前端查询页：`http://localhost:5173/`
- 前端用户建议页：`http://localhost:5173/feedback`
- 前端后台录入页：`http://localhost:5173/admin`
- 前端管理员建议箱：`http://localhost:5173/admin/suggestions`
- 后端写操作（新增/编辑/删除）需要管理员令牌。
- 后端令牌配置：启动后端前设置环境变量 `ADMIN_TOKEN`，默认值为 `dev-admin-token`。

## 建议数据管理与清除

- 建议数据文件：`backend/src/data/suggestions.json`
- 用户在 `/feedback` 提交后，后端会自动追加到该文件。
- 推荐管理方式（网页）：
  - 打开 `/admin/suggestions`
  - 输入管理员令牌后点击“加载建议”
  - 可删除单条建议，或点击“清空全部建议”
  - 可按时间范围筛选（全部/近7天/近30天）
  - 可点击“导出 CSV”导出当前筛选结果
- 你也可以手动清空文件内容为 `[]`（JSON 空数组），然后保存。

## 添加更多课程数据

- 推荐直接编辑 `backend/src/data/courses.js`
- 每条课程保持以下字段：
  - `id`（唯一递增）
  - `partnerUniversity`
  - `partnerCourseCode`
  - `partnerCourseName`
  - `partnerCredits`
  - `cuhkszCourseCode`
  - `cuhkszCourseName`
  - `cuhkszCredits`
  - `faculty`
  - `status`（`approved` / `pending`）
# LGU_Credit_Transfer_Search
