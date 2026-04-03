import { useEffect, useMemo, useState } from "react";

import { API_BASE } from "./apiBase";
import { REGION_OPTIONS, filterUniversitiesByRegion, getCourseRegion } from "./universityRegions";
import { translations } from "./translations";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const PAGE_SIZE_STORAGE_KEY = "queryPageSize";

function readStoredPageSize() {
  const n = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
  return PAGE_SIZE_OPTIONS.includes(n) ? n : 25;
}

function Query() {
  const [universities, setUniversities] = useState([]);
  /** 课程里显式设置的校名→地区，覆盖 universityRegions 内置表 */
  const [regionOverrides, setRegionOverrides] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** 地区：缩小合作院校下拉，并在下方对 API 返回结果再按地区过滤 */
  const [region, setRegion] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("language");
    return saved || "zh";
  });
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [announcement, setAnnouncement] = useState(null);

  const [filters, setFilters] = useState({
    university: "",
    keyword: "",
    cuhkszCourseCode: "",
    faculty: ""
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(readStoredPageSize);
  const [jumpPage, setJumpPage] = useState("");

  const universitiesInRegion = useMemo(
    () => filterUniversitiesByRegion(universities, region, regionOverrides),
    [universities, region, regionOverrides]
  );

  useEffect(() => {
    if (filters.university && !universitiesInRegion.includes(filters.university)) {
      setFilters((prev) => ({ ...prev, university: "" }));
    }
  }, [region, universitiesInRegion, filters.university]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return params.toString();
  }, [filters]);

  const loadUniversities = async () => {
    try {
      const res = await fetch(`${API_BASE}/universities`);
      const data = await res.json();
      setUniversities(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUniversityRegions = async () => {
    try {
      const res = await fetch(`${API_BASE}/university-regions`);
      const data = await res.json();
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setRegionOverrides(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnnouncement = async () => {
    try {
      const res = await fetch(`${API_BASE}/announcement`);
      const data = await res.json();
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setAnnouncement(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/courses?${queryString}`);
      const data = await res.json();
      setRows(data.data || []);
    } catch (e) {
      setError(translations[language].error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUniversities();
    loadUniversityRegions();
    loadAnnouncement();
  }, []);

  useEffect(() => {
    setPage(1);
    loadCourses();
  }, [queryString]);

  useEffect(() => {
    setPage(1);
  }, [region]);

  const rowsInRegion = useMemo(() => {
    if (!region) return rows;
    return rows.filter((row) => getCourseRegion(row, regionOverrides) === region);
  }, [rows, region, regionOverrides]);

  const totalCount = rowsInRegion.length;
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  useEffect(() => {
    setJumpPage(String(safePage));
  }, [safePage]);

  const commitJumpPage = () => {
    if (totalPages <= 0) return;
    const raw = String(jumpPage || "").trim();
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setJumpPage(String(safePage));
      return;
    }
    const next = Math.min(Math.max(1, Math.floor(n)), totalPages);
    setPage(next);
    setJumpPage(String(next));
  };

  const paginatedRows = useMemo(() => {
    if (totalCount === 0) return [];
    const p = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const start = (p - 1) * pageSize;
    return rowsInRegion.slice(start, start + pageSize);
  }, [rowsInRegion, page, pageSize, totalCount, totalPages]);

  const rangeFrom = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeTo = totalCount === 0 ? 0 : Math.min(safePage * pageSize, totalCount);

  const onPageSizeChange = (n) => {
    setPageSize(n);
    setPage(1);
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(n));
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem("darkMode", newValue);
  };

  const toggleLanguage = () => {
    const newValue = language === "zh" ? "en" : "zh";
    setLanguage(newValue);
    localStorage.setItem("language", newValue);
  };

  const onChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const goToFeedbackPage = () => {
    window.location.href = "/feedback";
  };

  const goToGithub = () => {
    window.open("https://github.com/Allgames817/LGU_Credit_Transfer_Search", "_blank");
  };

  const t = translations[language];
  const announcementFromApi =
    announcement && announcement.enabled !== false ? announcement : null;
  const announcementI18n = announcementFromApi
    ? language === "zh"
      ? announcementFromApi.zh
      : announcementFromApi.en
    : null;

  return (
    <div className="container">
      <div className="topControls">
        <button type="button" className="iconBtn" onClick={toggleDarkMode} title={darkMode ? t.darkModeTooltip.dark : t.darkModeTooltip.light}>
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button type="button" className="iconBtn" onClick={toggleLanguage} title={t.languageTooltip}>
          {language === "zh" ? "EN" : "中"}
        </button>
      </div>
      <header className="header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <div className="headerActions">
          <button
            type="button"
            className="jumpFeedbackBtn"
            onClick={() => {
              window.location.href = "/submit-transfer";
            }}
          >
            {t.submitTransferBtn}
          </button>
          <button type="button" className="jumpFeedbackBtn" onClick={goToFeedbackPage}>
            {t.feedbackBtn}
          </button>
          <button type="button" className="githubBtn" onClick={goToGithub}>
            GitHub
          </button>
        </div>
      </header>

      {!announcementDismissed && (announcementI18n || t.announcement) && (
        <section
          className="announcement"
          role="region"
          aria-label={(announcementI18n || t.announcement).title}
        >
          <div className="announcementHeader">
            <h2 className="announcementTitle">{(announcementI18n || t.announcement).title}</h2>
            <button
              type="button"
              className="announcementClose"
              onClick={() => {
                setAnnouncementDismissed(true);
              }}
              aria-label={t.announcement.close}
              title={t.announcement.close}
            >
              ×
            </button>
          </div>
          <div className="announcementBody">
            {Array.isArray((announcementI18n || t.announcement).body)
              ? (announcementI18n || t.announcement).body.map((line, idx) => <p key={idx}>{line}</p>)
              : null}
          </div>
        </section>
      )}

      <section className="filters">
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          {REGION_OPTIONS.map((r) => (
            <option key={r.id || "all"} value={r.id}>
              {r.label[language]}
            </option>
          ))}
        </select>

        <select
          value={filters.university}
          onChange={(e) => onChange("university", e.target.value)}
        >
          <option value="">{t.allUniversities}</option>
          {universitiesInRegion.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <input
          placeholder={t.keywordPlaceholder}
          value={filters.keyword}
          onChange={(e) => onChange("keyword", e.target.value)}
        />

        <select value={filters.faculty} onChange={(e) => onChange("faculty", e.target.value)}>
          <option value="">{t.allFaculties}</option>
          <option value="SDS">SDS</option>
          <option value="SSE">SSE</option>
          <option value="SME">SME</option>
          <option value="GE">GE</option>
        </select>

        <input
          placeholder={t.cuhkszCodePlaceholder}
          value={filters.cuhkszCourseCode}
          onChange={(e) => onChange("cuhkszCourseCode", e.target.value)}
        />
      </section>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <section className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>{t.tableHeaders.partnerUniversity}</th>
                <th>{t.tableHeaders.partnerCourse}</th>
                <th className="nowrap">{t.tableHeaders.faculty}</th>
                <th>{t.tableHeaders.cuhkszCourse}</th>
                <th>{t.tableHeaders.status}</th>
              </tr>
            </thead>
            <tbody>
              {totalCount === 0 ? (
                <tr>
                  <td colSpan={5}>{t.noResults}</td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.partnerUniversity}</td>
                    <td>
                      <strong>{row.partnerCourseCode}</strong>
                      <div>{row.partnerCourseName}</div>
                    </td>
                    <td>{row.faculty || "-"}</td>
                    <td>
                      <strong>{row.cuhkszCourseCode}</strong>
                      <div>{row.cuhkszCourseName}</div>
                    </td>
                    <td>
                      <span className={`tag ${row.status}`}>{row.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalCount > 0 && (
            <div className="queryPagination" role="navigation" aria-label="Pagination">
              <span className="queryPaginationSummary">
                {t.pagination.summary(totalCount, rangeFrom, rangeTo)}
              </span>
              <span className="queryPaginationPageOf">{t.pagination.pageOf(safePage, totalPages)}</span>
              <label className="queryPaginationSize">
                <span>{t.pagination.pageSize}</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="queryPaginationSize" style={{ gap: 6 }}>
                <span>{language === "zh" ? "跳转" : "Go to"}</span>
                <input
                  value={jumpPage}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitJumpPage();
                  }}
                  onBlur={commitJumpPage}
                  style={{ width: 90, padding: "6px 10px" }}
                  aria-label={language === "zh" ? "跳转到页码" : "Go to page"}
                />
                <span style={{ opacity: 0.85 }}>
                  {language === "zh" ? ` / ${totalPages} 页` : ` / ${totalPages}`}
                </span>
              </label>
              <div className="queryPaginationNav">
                <button
                  type="button"
                  className="paginationBtn"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t.pagination.prev}
                </button>
                <button
                  type="button"
                  className="paginationBtn"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t.pagination.next}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

    </div>
  );
}

export default Query;

