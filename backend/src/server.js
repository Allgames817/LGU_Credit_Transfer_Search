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

const ANNOUNCEMENT_FILE_PATH = suggestionsDataRoot
  ? path.join(suggestionsDataRoot, "announcement.json")
  : path.join(__dirname, "data", "announcement.json");

const COURSE_SUBMISSIONS_FILE_PATH = suggestionsDataRoot
  ? path.join(suggestionsDataRoot, "course_submissions.json")
  : path.join(__dirname, "data", "course_submissions.json");

/** 所有「读-改-写」串行执行，避免并发提交互相覆盖导致丢数据 */
let suggestionMutationQueue = Promise.resolve();
let announcementMutationQueue = Promise.resolve();
let courseSubmissionMutationQueue = Promise.resolve();

function enqueueSuggestionMutation(fn) {
  const run = suggestionMutationQueue.then(() => fn());
  suggestionMutationQueue = run.catch((e) => {
    console.error("[suggestions] mutation error", e && e.message ? e.message : e);
  }).then(() => {});
  return run;
}

function enqueueAnnouncementMutation(fn) {
  const run = announcementMutationQueue.then(() => fn());
  announcementMutationQueue = run.catch((e) => {
    console.error("[announcement] mutation error", e && e.message ? e.message : e);
  }).then(() => {});
  return run;
}

function enqueueCourseSubmissionMutation(fn) {
  const run = courseSubmissionMutationQueue.then(() => fn());
  courseSubmissionMutationQueue = run.catch((e) => {
    console.error("[course-submissions] mutation error", e && e.message ? e.message : e);
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

const clipStr = (value, max) => String(value ?? "").trim().slice(0, max);

const readCourseSubmissionsFromFile = async () => {
  try {
    const raw = (await fs.readFile(COURSE_SUBMISSIONS_FILE_PATH, "utf8")).replace(/^\uFEFF/, "");
    if (!String(raw).trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err && err.code === "ENOENT") return [];
    if (err instanceof SyntaxError) {
      try {
        const backup = `${COURSE_SUBMISSIONS_FILE_PATH}.corrupt-${Date.now()}`;
        await fs.copyFile(COURSE_SUBMISSIONS_FILE_PATH, backup);
        console.error("[course-submissions] JSON 损坏，已备份到", backup);
      } catch (_) {
        /* ignore */
      }
      try {
        await fs.unlink(COURSE_SUBMISSIONS_FILE_PATH);
      } catch (_) {
        /* ignore */
      }
      return [];
    }
    throw err;
  }
};

const saveCourseSubmissionsAtomic = async (rows) => {
  const dir = path.dirname(COURSE_SUBMISSIONS_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });
  const data = `${JSON.stringify(rows, null, 2)}\n`;
  const tmp = path.join(dir, `.course_submissions.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmp, data, "utf8");
  await fs.rename(tmp, COURSE_SUBMISSIONS_FILE_PATH);
};

const nextCourseSubmissionId = (rows) =>
  rows.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0) + 1;

const DEFAULT_ANNOUNCEMENT = {
  enabled: true,
  zh: {
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
  },
  en: {
    title: "Announcement: Credit Transfer Search is Live",
    body: [
      "Data on this site is compiled from historical credit transfer records maintained by the Academic Affairs Offices of SSE, SDS, and SME. We systematically organize successful credit transfer cases from previous cohorts into a searchable database. Before your exchange, you can search by partner university and course title to see how the course has been recognized at CUHK-Shenzhen in the past and which credit category it falls under, as a reference for course planning.",
      "At present, the dataset mainly covers SSE, SDS, and SME. For GE (General Education) courses, we currently only include mapping cases related to CUHK summer courses. Please note that the information on this site is organized from past records and is for reference only. Final credit recognition is subject to the approval of your School/Faculty and OAL. If you are unsure or the course is not included on the site, please email the Academic Affairs Office for confirmation.",
      "During course selection, these records can serve as evidence-based reference; when you return and submit your credit transfer application, you may also refer to successful cases on the site, which can help reduce communication overhead with administrative offices. If you already have verified course mappings, you are welcome to submit them through the website to help future students avoid unnecessary detours.",
      "We hope this provides a practical and reliable reference for every student participating in overseas exchange—supporting better program choices and course planning."
    ],
  }
};

function sanitizeAnnouncement(input) {
  const enabled =
    input && Object.prototype.hasOwnProperty.call(input, "enabled")
      ? Boolean(input.enabled)
      : Boolean(DEFAULT_ANNOUNCEMENT.enabled);

  const sanitizeLang = (lang, fallback) => {
    const title = String(lang?.title || "").trim() || fallback.title;
    const bodyRaw = Array.isArray(lang?.body) ? lang.body : [];
    const body = bodyRaw
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .slice(0, 30);
    return {
      title,
      body: body.length ? body : fallback.body,
    };
  };

  return {
    enabled,
    zh: sanitizeLang(input?.zh, DEFAULT_ANNOUNCEMENT.zh),
    en: sanitizeLang(input?.en, DEFAULT_ANNOUNCEMENT.en)
  };
}

const readAnnouncementFromFile = async () => {
  try {
    const raw = (await fs.readFile(ANNOUNCEMENT_FILE_PATH, "utf8")).replace(/^\uFEFF/, "");
    if (!String(raw).trim()) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return sanitizeAnnouncement(parsed);
  } catch (err) {
    if (err && err.code === "ENOENT") return null;
    if (err instanceof SyntaxError) return null;
    throw err;
  }
};

const saveAnnouncementAtomic = async (announcement) => {
  const dir = path.dirname(ANNOUNCEMENT_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });
  const data = `${JSON.stringify(announcement, null, 2)}\n`;
  const tmp = path.join(dir, `.announcement.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmp, data, "utf8");
  await fs.rename(tmp, ANNOUNCEMENT_FILE_PATH);
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

app.get("/api/announcement", async (_, res) => {
  try {
    const saved = await readAnnouncementFromFile();
    res.json(saved || DEFAULT_ANNOUNCEMENT);
  } catch (err) {
    res.status(500).json({ message: "Failed to load announcement" });
  }
});

app.put("/api/announcement", requireAdmin, async (req, res) => {
  try {
    const sanitized = sanitizeAnnouncement(req.body || {});
    await enqueueAnnouncementMutation(async () => saveAnnouncementAtomic(sanitized));
    res.json({ ok: true, data: sanitized });
  } catch (err) {
    res.status(500).json({ message: "Failed to save announcement" });
  }
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

/** 用户自助提交「已成功转学分」课程对应，待管理员审核后写入 courses */
app.post("/api/course-submissions", async (req, res) => {
  const b = req.body || {};
  const partnerUniversity = clipStr(b.partnerUniversity, 220);
  const partnerCourseCode = clipStr(b.partnerCourseCode, 120);
  const partnerCourseName = clipStr(b.partnerCourseName, 500);
  const cuhkszCourseCode = clipStr(b.cuhkszCourseCode, 120);
  const cuhkszCourseName = clipStr(b.cuhkszCourseName, 500);
  const faculty = clipStr(b.faculty, 24);
  const submitterName = clipStr(b.submitterName, 100);
  const remark = clipStr(b.remark, 2000);

  if (!partnerUniversity || !partnerCourseCode || !partnerCourseName || !cuhkszCourseCode || !cuhkszCourseName) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const partnerRegionNorm = normalizePartnerRegion(b.partnerRegion);
  if (!partnerRegionNorm) {
    return res.status(400).json({ message: "Invalid or missing partnerRegion" });
  }

  const partnerCredits = Number(b.partnerCredits);
  const cuhkszCredits = Number(b.cuhkszCredits);
  if (!Number.isFinite(partnerCredits) || partnerCredits < 0 || partnerCredits > 40) {
    return res.status(400).json({ message: "Invalid partnerCredits" });
  }
  if (!Number.isFinite(cuhkszCredits) || cuhkszCredits < 0 || cuhkszCredits > 40) {
    return res.status(400).json({ message: "Invalid cuhkszCredits" });
  }

  try {
    const row = await enqueueCourseSubmissionMutation(async () => {
      const list = await readCourseSubmissionsFromFile();
      const entry = {
        id: nextCourseSubmissionId(list),
        status: "pending",
        createdAt: new Date().toISOString(),
        submitterName: submitterName || "匿名",
        partnerUniversity,
        partnerRegion: partnerRegionNorm,
        partnerCourseCode,
        partnerCourseName,
        partnerCredits,
        cuhkszCourseCode,
        cuhkszCourseName,
        cuhkszCredits,
        faculty,
        remark
      };
      list.push(entry);
      await saveCourseSubmissionsAtomic(list);
      return entry;
    });
    return res.status(201).json({ ok: true, data: row });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save submission" });
  }
});

app.get("/api/course-submissions", requireAdmin, async (req, res) => {
  try {
    const list = await readCourseSubmissionsFromFile();
    const st = String(req.query.status || "").trim().toLowerCase();
    const filtered =
      st && ["pending", "approved", "rejected"].includes(st)
        ? list.filter((x) => String(x.status) === st)
        : list;
    res.json({
      total: filtered.length,
      data: filtered.slice().sort((a, b) => Number(b.id) - Number(a.id))
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load course submissions" });
  }
});

app.post("/api/course-submissions/:id/approve", requireAdmin, async (req, res) => {
  const sid = Number(req.params.id);
  if (!Number.isFinite(sid)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const body = req.body || {};
  const pick = (key, sub, max) =>
    Object.prototype.hasOwnProperty.call(body, key) ? clipStr(body[key], max) : clipStr(sub[key], max);

  try {
    const result = await enqueueCourseSubmissionMutation(async () => {
      const list = await readCourseSubmissionsFromFile();
      const idx = list.findIndex((x) => Number(x.id) === sid);
      if (idx === -1) return { err: 404, message: "Submission not found" };
      const sub = list[idx];
      if (sub.status !== "pending") {
        return { err: 400, message: "Only pending submissions can be approved" };
      }

      const partnerUniversity = pick("partnerUniversity", sub, 220);
      const partnerCourseCode = pick("partnerCourseCode", sub, 120);
      const partnerCourseName = pick("partnerCourseName", sub, 500);
      const cuhkszCourseCode = pick("cuhkszCourseCode", sub, 120);
      const cuhkszCourseName = pick("cuhkszCourseName", sub, 500);
      const faculty = pick("faculty", sub, 24);
      if (!partnerUniversity || !partnerCourseCode || !partnerCourseName || !cuhkszCourseCode || !cuhkszCourseName) {
        return { err: 400, message: "Missing required course fields" };
      }

      const regionSource = Object.prototype.hasOwnProperty.call(body, "partnerRegion")
        ? body.partnerRegion
        : sub.partnerRegion;
      const partnerRegionNorm = normalizePartnerRegion(regionSource);
      if (!partnerRegionNorm) {
        return { err: 400, message: "Invalid partnerRegion" };
      }

      let partnerCredits = Object.prototype.hasOwnProperty.call(body, "partnerCredits")
        ? Number(body.partnerCredits)
        : Number(sub.partnerCredits);
      let cuhkszCredits = Object.prototype.hasOwnProperty.call(body, "cuhkszCredits")
        ? Number(body.cuhkszCredits)
        : Number(sub.cuhkszCredits);
      if (!Number.isFinite(partnerCredits) || partnerCredits < 0) partnerCredits = 0;
      if (!Number.isFinite(cuhkszCredits) || cuhkszCredits < 0) cuhkszCredits = 0;

      const nextCourseId = courses.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;
      const newCourse = {
        id: nextCourseId,
        partnerUniversity,
        partnerCourseCode,
        partnerCourseName,
        partnerCredits,
        cuhkszCourseCode,
        cuhkszCourseName,
        cuhkszCredits,
        faculty,
        status: "approved",
        partnerRegion: partnerRegionNorm
      };

      courses.push(newCourse);
      try {
        await saveCoursesToFile();
      } catch (e) {
        courses.pop();
        throw e;
      }

      list[idx] = {
        ...sub,
        status: "approved",
        reviewedAt: new Date().toISOString(),
        approvedCourseId: nextCourseId
      };
      await saveCourseSubmissionsAtomic(list);
      return { ok: true, submission: list[idx], course: newCourse };
    });

    if (result.err) {
      return res.status(result.err).json({ message: result.message });
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Failed to approve submission" });
  }
});

app.post("/api/course-submissions/:id/reject", requireAdmin, async (req, res) => {
  const sid = Number(req.params.id);
  if (!Number.isFinite(sid)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  const reason = clipStr(req.body?.reason, 500);

  try {
    const result = await enqueueCourseSubmissionMutation(async () => {
      const list = await readCourseSubmissionsFromFile();
      const idx = list.findIndex((x) => Number(x.id) === sid);
      if (idx === -1) return { err: 404, message: "Submission not found" };
      const sub = list[idx];
      if (sub.status !== "pending") {
        return { err: 400, message: "Only pending submissions can be rejected" };
      }
      list[idx] = {
        ...sub,
        status: "rejected",
        reviewedAt: new Date().toISOString(),
        rejectReason: reason
      };
      await saveCourseSubmissionsAtomic(list);
      return { ok: true, data: list[idx] };
    });
    if (result.err) {
      return res.status(result.err).json({ message: result.message });
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: "Failed to reject submission" });
  }
});

app.delete("/api/course-submissions/:id", requireAdmin, async (req, res) => {
  const sid = Number(req.params.id);
  if (!Number.isFinite(sid)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  try {
    const result = await enqueueCourseSubmissionMutation(async () => {
      const list = await readCourseSubmissionsFromFile();
      const idx = list.findIndex((x) => Number(x.id) === sid);
      if (idx === -1) return { err: 404 };
      list.splice(idx, 1);
      await saveCourseSubmissionsAtomic(list);
      return { ok: true };
    });
    if (result.err) {
      return res.status(404).json({ message: "Submission not found" });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete submission" });
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
      suggestions: "/api/suggestions",
      courseSubmissions: "/api/course-submissions"
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
  console.log(`[course-submissions] storage file: ${COURSE_SUBMISSIONS_FILE_PATH}`);
});
