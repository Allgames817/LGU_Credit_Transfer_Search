/** 开发环境直连后端；生产构建默认同域 /api（由 Nginx 或 Express 反代到 Node） */
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");
