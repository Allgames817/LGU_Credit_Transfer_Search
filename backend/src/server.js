const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");
const courses = require("./data/courses");

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "dev-admin-token";
const COURSES_FILE_PATH = path.join(__dirname, "data", "courses.js");
const SUGGESTIONS_FILE_PATH = path.join(__dirname, "data", "suggestions.json");

app.use(cors());
app.use(express.json());

const normalize = (text) => String(text || "").toLowerCase().trim();

const formatCourseForFile = (course) => {
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
    const raw = await fs.readFile(SUGGESTIONS_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // If file does not exist yet, treat it as empty.
    if (err && err.code === "ENOENT") return [];
    throw err;
  }
};

const saveSuggestionsToFile = async (suggestions) => {
  await fs.writeFile(SUGGESTIONS_FILE_PATH, JSON.stringify(suggestions, null, 2), "utf8");
};

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

app.get("/", (_, res) => {
  res.json({
    message: "Backend is running",
    health: "/api/health",
    courses: "/api/courses",
    universities: "/api/universities",
    suggestions: "/api/suggestions"
  });
});

app.get("/api/universities", (_, res) => {
  const universities = [...new Set(courses.map((c) => c.partnerUniversity))].sort();
  res.json(universities);
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

  const suggestion = {
    id: Date.now(),
    name: name || "匿名用户",
    message,
    createdAt: new Date().toISOString()
  };

  try {
    const suggestions = await readSuggestionsFromFile();
    suggestions.push(suggestion);
    await saveSuggestionsToFile(suggestions);
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
    const suggestions = await readSuggestionsFromFile();
    const idx = suggestions.findIndex((s) => Number(s.id) === id);
    if (idx === -1) return res.status(404).json({ message: "Suggestion not found" });
    const [removed] = suggestions.splice(idx, 1);
    await saveSuggestionsToFile(suggestions);
    return res.json({ ok: true, data: removed });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete suggestion" });
  }
});

app.delete("/api/suggestions", requireAdmin, async (_, res) => {
  try {
    await saveSuggestionsToFile([]);
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
    status: payload.status || "pending"
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
    status: payload.status || "pending"
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

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
