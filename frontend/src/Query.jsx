import { useEffect, useMemo, useState } from "react";

import { API_BASE } from "./apiBase";
import { REGION_OPTIONS, filterUniversitiesByRegion } from "./universityRegions";
import { translations } from "./translations";

function Query() {
  const [universities, setUniversities] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** 仅用于缩小合作院校下拉框，不参与 API 查询 */
  const [region, setRegion] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("language");
    return saved || "zh";
  });

  const [filters, setFilters] = useState({
    university: "",
    keyword: "",
    cuhkszCourseCode: "",
    faculty: ""
  });

  const universitiesInRegion = useMemo(
    () => filterUniversitiesByRegion(universities, region),
    [universities, region]
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
  }, []);

  useEffect(() => {
    loadCourses();
  }, [queryString]);

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
          <button type="button" className="jumpFeedbackBtn" onClick={goToFeedbackPage}>
            {t.feedbackBtn}
          </button>
          <button type="button" className="githubBtn" onClick={goToGithub}>
            GitHub
          </button>
        </div>
      </header>

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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t.noResults}</td>
                </tr>
              ) : (
                rows.map((row) => (
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
        </section>
      )}

    </div>
  );
}

export default Query;

