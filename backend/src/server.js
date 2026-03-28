const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const courses = require("./data/courses");

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "dev-admin-token";
const COURSES_FILE_PATH = path.join(__dirname, "data", "courses.js");
/**
 * 建议文件路径：
 * - 优先 `SUGGESTIONS_DATA_DIR`（手动指定持久目录）
 * - 否则若存在 `RAILWAY_VOLUME_MOUNT_PATH`（Railway 挂卷后自动注入），使用该目录
 * - 否则使用仓库内 backend/src/data/suggestions.json
 */
const suggestionsDataRoot = (() => {
  const manual = String(process.env.SUGGESTIONS_DATA_DIR || "").trim();
  if (manual) return path.resolve(manual);
  const railway = String(process.env.RAILWAY_VOLUME_MOUNT_PATH || "").trim();
  if (railway) return path.resolve(railway);
  return null;
})();
const SUGGESTIONS_FILE_PATH = suggestionsDataRoot
  ? path.join(suggestionsDataRoot, "suggestions.json")
  : path.join(__dirname, "data", "suggestions.json");

/** 所有「读-改-写」串行执行，避免并发提交互相覆盖导致丢数据 */
let suggestionMutationQueue = Promise.resolve();

function enqueueSuggestionMutation(fn) {
  const run = suggestionMutationQueue.then(() => fn());
  suggestionMutationQueue = run.catch((e) => {
    console.error("[suggestions] mutation error", e && e.message ? e.message : e);
  }).then(() => {});
  return run;
}

app.use(cors());
app.use(express.json());

const normalize = (text) => String(text || "").toLowerCase().trim();

const ALLOWED_PARTNER_REGIONS = new Set(["asia", "europe", "americas", "oceania", "other"]);

function normalizePartnerRegion(value) {
  const r = normalize(value);
  if (!r) return "";
  if (!ALLOWED_PARTNER_REGIONS.has(r)) return null;
  return r;
}

const formatCourseForFile = (course) => {
  const pr = normalizePartnerRegion(course.partnerRegion);
  const regionOut = pr === null ? "" : pr;
  const fields = [
    `id: ${Number(course.id)}`,
    `partnerUniversity: ${JSON.stringify(String(course.partnerUniversity || ""))}`,
    `partnerCourseCode: ${JSON.stringify(String(course.partnerCourseCode || ""))}`,
    `partnerCourseName: ${JSON.stringify(String(course.partnerCourseName || ""))}`,
    `partnerCredits: ${Number(course.partnerCredits || 0)}`,
    `cuhkszCourseCode: ${JSON.stringify(String(course.cuhkszCourseCode || ""))}`,
    `cuhkszCourseName: ${JSON.stringify(String(course.cuhkszCourseName || ""))}`,
    `cuhkszCredits: ${Number(course.cuhkszCredits || 0)}`,
    `faculty: ${JSON.stringify(String(course.faculty || ""))}`,
    `status: ${JSON.stringify(String(course.status || "pending"))}`
  ];
  if (regionOut) {
    fields.splice(1, 0, `partnerRegion: ${JSON.stringify(regionOut)}`);
  }
  return `  { ${fields.join(", ")} }`;
};

const saveCoursesToFile = async () => {
  const content = `const courses = [
${courses.map(formatCourseForFile).join(",\n")}
];

module.exports = courses;
`;
  await fs.writeFile(COURSES_FILE_PATH, content, "utf8");
};

const readSuggestionsFromFile = async () => {
  try {
    const raw = (await fs.readFile(SUGGESTIONS_FILE_PATH, "utf8")).replace(/^\uFEFF/, "");
    if (!String(raw).trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err && err.code === "ENOENT") return [];
    if (err instanceof SyntaxError) {
      try {
        const backup = `${SUGGESTIONS_FILE_PATH}.corrupt-${Date.now()}`;
        await fs.copyFile(SUGGESTIONS_FILE_PATH, backup);
        console.error("[suggestions] JSON 损坏，已备份到", backup);
      } catch (_) {
        /* ignore */
      }
      try {
        await fs.unlink(SUGGESTIONS_FILE_PATH);
      } catch (_) {
        /* ignore */
      }
      return [];
    }
    throw err;
  }
};

/** 先写临时文件再 rename，避免写入中途崩溃导致 JSON 截断无法解析 */
const saveSuggestionsAtomic = async (suggestions) => {
  const dir = path.dirname(SUGGESTIONS_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });
  const data = `${JSON.stringify(suggestions, null, 2)}\n`;
  const tmp = path.join(dir, `.suggestions.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmp, data, "utf8");
  await fs.rename(tmp, SUGGESTIONS_FILE_PATH);
};

const nextSuggestionId = (suggestions) =>
  suggestions.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0) + 1;

const requireAdmin = (req, res, next) => {
  const auth = String(req.headers["authorization"] || "");
  const tokenFromBearer = auth.replace(/^Bearer\s+/i, "");
  const tokenFromHeader = tokenFromBearer || String(req.headers["x-admin-token"] || "");
  const token = String(tokenFromHeader).trim();
  const expected = String(ADMIN_TOKEN).trim();

  if (!token || token !== expected) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};

app.get("/api/health", (_, res) => {
  res.json({ ok: true, service: "credit-transfer-backend" });
});

app.get("/api/universities", (_, res) => {
  const universities = [...new Set(courses.map((c) => c.partnerUniversity))].sort();
  res.json(universities);
});

/** 课程里显式设置的 partnerRegion（按校名），供前端地区筛选覆盖内置 universityRegions 表 */
app.get("/api/university-regions", (_, res) => {
  const map = {};
  for (const c of courses) {
    const u = String(c.partnerUniversity || "").trim();
    const pr = normalizePartnerRegion(c.partnerRegion);
    if (u && pr) map[u] = pr;
  }
  res.json(map);
});

app.get("/api/courses", (req, res) => {
  const { university, keyword, cuhkszCourseCode, status, faculty } = req.query;

  const result = courses.filter((course) => {
    const matchedUniversity =
      !university || normalize(course.partnerUniversity) === normalize(university);
    const matchedKeyword =
      !keyword ||
      normalize(course.partnerCourseName).includes(normalize(keyword)) ||
      normalize(course.partnerCourseCode).includes(normalize(keyword)) ||
      normalize(course.cuhkszCourseName).includes(normalize(keyword)) ||
      normalize(course.cuhkszCourseCode).includes(normalize(keyword));
    const matchedCUHKCourse =
      !cuhkszCourseCode ||
      normalize(course.cuhkszCourseCode).includes(normalize(cuhkszCourseCode));
    const matchedStatus = !status || normalize(course.status) === normalize(status);
    const matchedFaculty = !faculty || normalize(course.faculty) === normalize(faculty);

    return matchedUniversity && matchedKeyword && matchedCUHKCourse && matchedStatus && matchedFaculty;
  });

  res.json({
    total: result.length,
    data: result
  });
});

app.post("/api/suggestions", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const message = String(req.body?.message || "").trim();

  if (!message) {
    return res.status(400).json({ message: "Suggestion message is required" });
  }
  if (message.length > 2000) {
    return res.status(400).json({ message: "Suggestion message is too long" });
  }

  try {
    const suggestion = await enqueueSuggestionMutation(async () => {
      const suggestions = await readSuggestionsFromFile();
      const row = {
        id: nextSuggestionId(suggestions),
        name: name || "匿名用户",
        message,
        createdAt: new Date().toISOString()
      };
      suggestions.push(row);
      await saveSuggestionsAtomic(suggestions);
      return row;
    });
    return res.status(201).json({ ok: true, data: suggestion });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save suggestion" });
  }
});

app.get("/api/suggestions", requireAdmin, async (req, res) => {
  try {
    const suggestions = await readSuggestionsFromFile();
    res.json({
      total: suggestions.length,
      data: suggestions
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load suggestions" });
  }
});

app.delete("/api/suggestions/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: "Invalid suggestion id" });
  }

  try {
    const removed = await enqueueSuggestionMutation(async () => {
      const suggestions = await readSuggestionsFromFile();
      const idx = suggestions.findIndex((s) => Number(s.id) === id);
      if (idx === -1) return null;
      const [row] = suggestions.splice(idx, 1);
      await saveSuggestionsAtomic(suggestions);
      return row;
    });
    if (!removed) return res.status(404).json({ message: "Suggestion not found" });
    return res.json({ ok: true, data: removed });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete suggestion" });
  }
});

app.delete("/api/suggestions", requireAdmin, async (_, res) => {
  try {
    await enqueueSuggestionMutation(async () => {
      await saveSuggestionsAtomic([]);
    });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to clear suggestions" });
  }
});

app.post("/api/courses", requireAdmin, async (req, res) => {
  const payload = req.body;
  const requiredFields = [
    "partnerUniversity",
    "partnerCourseCode",
    "partnerCourseName",
    "cuhkszCourseCode",
    "cuhkszCourseName"
  ];

  const missing = requiredFields.filter((field) => !payload[field]);
  if (missing.length > 0) {
    return res.status(400).json({
      message: "Missing required fields",
      missing
    });
  }

  const partnerRegionNorm = normalizePartnerRegion(payload.partnerRegion);
  if (partnerRegionNorm === null) {
    return res.status(400).json({
      message: "Invalid partnerRegion",
      allowed: [...ALLOWED_PARTNER_REGIONS]
    });
  }

  const newCourse = {
    id: courses.length + 1,
    partnerUniversity: payload.partnerUniversity,
    partnerCourseCode: payload.partnerCourseCode,
    partnerCourseName: payload.partnerCourseName,
    partnerCredits: Number(payload.partnerCredits || 0),
    cuhkszCourseCode: payload.cuhkszCourseCode,
    cuhkszCourseName: payload.cuhkszCourseName,
    cuhkszCredits: Number(payload.cuhkszCredits || 0),
    faculty: payload.faculty || "",
    status: payload.status || "pending",
    partnerRegion: partnerRegionNorm
  };

  courses.push(newCourse);
  try {
    await saveCoursesToFile();
  } catch (err) {
    courses.pop();
    return res.status(500).json({ message: "Failed to persist courses data" });
  }
  return res.status(201).json(newCourse);
});

app.get("/api/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const course = courses.find((c) => c.id === id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  return res.json(course);
});

app.put("/api/courses/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body;

  const requiredFields = [
    "partnerUniversity",
    "partnerCourseCode",
    "partnerCourseName",
    "cuhkszCourseCode",
    "cuhkszCourseName"
  ];

  const missing = requiredFields.filter((field) => !payload[field]);
  if (missing.length > 0) {
    return res.status(400).json({
      message: "Missing required fields",
      missing
    });
  }

  const partnerRegionNorm = normalizePartnerRegion(payload.partnerRegion);
  if (partnerRegionNorm === null) {
    return res.status(400).json({
      message: "Invalid partnerRegion",
      allowed: [...ALLOWED_PARTNER_REGIONS]
    });
  }

  const idx = courses.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ message: "Course not found" });

  const updated = {
    ...courses[idx],
    partnerUniversity: payload.partnerUniversity,
    partnerCourseCode: payload.partnerCourseCode,
    partnerCourseName: payload.partnerCourseName,
    partnerCredits: Number(payload.partnerCredits || 0),
    cuhkszCourseCode: payload.cuhkszCourseCode,
    cuhkszCourseName: payload.cuhkszCourseName,
    cuhkszCredits: Number(payload.cuhkszCredits || 0),
    faculty: payload.faculty || "",
    status: payload.status || "pending",
    partnerRegion: partnerRegionNorm
  };

  const original = courses[idx];
  courses[idx] = updated;
  try {
    await saveCoursesToFile();
  } catch (err) {
    courses[idx] = original;
    return res.status(500).json({ message: "Failed to persist courses data" });
  }
  return res.json(updated);
});

app.delete("/api/courses/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const idx = courses.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ message: "Course not found" });
  const [removed] = courses.splice(idx, 1);
  try {
    await saveCoursesToFile();
  } catch (err) {
    courses.splice(idx, 0, removed);
    return res.status(500).json({ message: "Failed to persist courses data" });
  }
  return res.json(removed);
});

// 生产构建由根目录 npm run build 复制到 backend/public（与 NODE_ENV 无关，避免 Railway 未注入 production 时不托管前端）
const distPath = path.join(__dirname, "..", "public");
const indexHtml = path.join(distPath, "index.html");
const serveFrontend = fsSync.existsSync(indexHtml);

if (serveFrontend) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not found" });
    }
    res.sendFile(indexHtml);
  });
} else {
  app.get("/", (_, res) => {
    res.json({
      message: "Backend is running",
      health: "/api/health",
      courses: "/api/courses",
      universities: "/api/universities",
      suggestions: "/api/suggestions"
    });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on 0.0.0.0:${PORT}`);
  console.log(
    `[suggestions] storage file: ${SUGGESTIONS_FILE_PATH}` +
      (suggestionsDataRoot
        ? ` (dir from ${String(process.env.SUGGESTIONS_DATA_DIR || "").trim() ? "SUGGESTIONS_DATA_DIR" : "RAILWAY_VOLUME_MOUNT_PATH"})`
        : " (bundled backend/src/data)")
  );
});
