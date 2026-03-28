/**
 * 将 Vite 产物复制到 backend/public，便于生产环境用固定相对路径托管静态资源（适配 Railway 等）。
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "frontend", "dist");
const dest = path.join(root, "backend", "public");

if (!fs.existsSync(path.join(src, "index.html"))) {
  console.error("copy-frontend-to-backend-public: missing frontend/dist/index.html — run frontend build first");
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log("copy-frontend-to-backend-public: ok -> backend/public");
