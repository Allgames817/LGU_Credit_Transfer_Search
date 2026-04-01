/**
 * 合作院校所属地区（与 backend 课程数据中的 partnerUniversity 英文全称一致）。
 * 管理员在后台可为课程设置 partnerRegion 写入 courses.js，将覆盖此表；未设置且无内置项时归为「其他」。
 */
export const REGION_OPTIONS = [
  { id: "", label: { zh: "全部地区", en: "All Regions" } },
  { id: "asia", label: { zh: "亚洲", en: "Asia" } },
  { id: "europe", label: { zh: "欧洲", en: "Europe" } },
  { id: "americas", label: { zh: "美洲", en: "Americas" } },
  { id: "oceania", label: { zh: "大洋洲", en: "Oceania" } },
  { id: "other", label: { zh: "其他", en: "Other" } }
];

/** 管理员地区下拉（均会写入课程 partnerRegion） */
export const ADMIN_PARTNER_REGION_OPTIONS = [
  { id: "asia", label: "亚洲" },
  { id: "europe", label: "欧洲" },
  { id: "americas", label: "美洲" },
  { id: "oceania", label: "大洋洲" },
  { id: "other", label: "其他" }
];

/** @type {Record<string, 'asia' | 'europe' | 'americas' | 'oceania' | 'other'>} */
const UNIVERSITY_REGION = {
  // 亚洲
  "City University of Hong Kong": "asia",
  "Fudan University": "asia",
  "Hanyang University": "asia",
  "International Christian University": "asia",
  "Korea University": "asia",
  "Nanyang Technological University": "asia",
  "National Tsing Hua University": "asia",
  "National University of Singapore": "asia",
  "Seoul National University": "asia",
  "Shanghai Jiao Tong University": "asia",
  "Singapore Management University": "asia",
  "Sungkyunkwan University": "asia",
  "The Chinese University of Hong Kong": "asia",
  "University of International Business and Economics": "asia",
  "University of Malaya": "asia",
  "Yonsei University": "asia",
  // 欧洲
  "Aalto University": "europe",
  "Bocconi University": "europe",
  "Copenhagen Business School": "europe",
  "Erasmus University Rotterdam": "europe",
  "IE University": "europe",
  "KU LEUVEN": "europe",
  "Norwegian School of Economics": "europe",
  "Technical University of Munich": "europe",
  "The London School of Economics and Political Scien": "europe",
  "The London School of Economics and Political Science": "europe",
  "The University of Warwick": "europe",
  "University College Cork": "europe",
  "University College Dublin": "europe",
  "University College London": "europe",
  "University of Bristol": "europe",
  "University of Cologne": "europe",
  "University of Groningen": "europe",
  "University of Oxford": "europe",
  "University of Padova": "europe",
  "University of St. Gallen": "europe",
  "University of Sussex": "europe",
  // 美洲（含加拿大）
  "Boston University": "americas",
  "Duke University": "americas",
  "Harvard University": "americas",
  "Keiser University": "americas",
  "McGill University": "americas",
  "McMaster University": "americas",
  "Ottawa University": "americas",
  "Purdue University": "americas",
  "Stanford University": "americas",
  "The University of British Columbia": "americas",
  "The University of North Carolina at Chapel Hill": "americas",
  "University of Alberta": "americas",
  "University of California, Berkeley": "americas",
  "University of California, Davi": "americas",
  "University of California, Irvine": "americas",
  "University of California, Los Angeles": "americas",
  "University of California, San Diego": "americas",
  "University of Michigan": "americas",
  "University of Michigan, Ann Arbor": "americas",
  "University of Minnesota": "americas",
  "University of Notre Dame": "americas",
  "University of Pennsylvania": "americas",
  "University of Rochester": "americas",
  "University of South Carolina": "americas",
  "University of Southern California": "americas",
  "University of Texas at Dallas": "americas",
  "University of Wisconsin-Madison": "americas",
  "Yale University": "americas",
  // 大洋洲
  "The University of Melbourne": "oceania",
  "The University of New South Wales": "oceania",
  "The University of Queensland": "oceania",
  "University of Aukland": "oceania",
  "University of Newcastle": "oceania",
  "University of New South Wales": "oceania"
};

const KNOWN_REGION_IDS = new Set(["asia", "europe", "americas", "oceania", "other"]);

/**
 * @param {string} universityName
 * @param {Record<string, string>} [overrides] 来自课程数据 partnerRegion（按校名覆盖内置表）
 */
export function getUniversityRegion(universityName, overrides) {
  const key = String(universityName || "").trim();
  const raw = overrides && key ? overrides[key] : "";
  if (raw && KNOWN_REGION_IDS.has(raw)) return raw;
  return UNIVERSITY_REGION[key] || "other";
}

/**
 * 单条课程所属地区：优先课程自身 partnerRegion（管理员写入），否则按校名查表 + 覆盖。
 * 用于查询页在已选地区时过滤结果行（与仅缩小院校下拉的逻辑一致）。
 */
export function getCourseRegion(course, overrides) {
  const fromRow = String(course?.partnerRegion || "")
    .trim()
    .toLowerCase();
  if (fromRow && KNOWN_REGION_IDS.has(fromRow)) return fromRow;
  return getUniversityRegion(course?.partnerUniversity, overrides);
}

export function filterUniversitiesByRegion(universities, regionId, overrides) {
  if (!regionId) return universities;
  return universities.filter((u) => getUniversityRegion(u, overrides) === regionId);
}
