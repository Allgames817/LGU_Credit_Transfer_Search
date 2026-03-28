/**
 * 合作院校所属地区（与 backend 课程数据中的 partnerUniversity 英文全称一致）。
 * 新增院校时请在此补充；未收录的院校在筛选中归入「其他」。
 */
export const REGION_OPTIONS = [
  { id: "", label: "全部地区" },
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
  "Sungkyunkwan Univeristy": "asia",
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
  "The University of California, Berkeley": "americas",
  "The University of North Carolina at Chapel Hill": "americas",
  "University of Alberta": "americas",
  "University of California at Los Angeles": "americas",
  "University of California, Berkeley": "americas",
  "University of California, Davi": "americas",
  "University of California, Irvine": "americas",
  "University of California, LA": "americas",
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

export function getUniversityRegion(universityName) {
  const key = String(universityName || "").trim();
  return UNIVERSITY_REGION[key] || "other";
}

export function filterUniversitiesByRegion(universities, regionId) {
  if (!regionId) return universities;
  return universities.filter((u) => getUniversityRegion(u) === regionId);
}
