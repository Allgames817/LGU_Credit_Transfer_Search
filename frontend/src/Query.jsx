import { useEffect, useMemo, useState } from "react";

import { API_BASE } from "./apiBase";
import { REGION_OPTIONS, filterUniversitiesByRegion } from "./universityRegions";

function Query() {
  const [universities, setUniversities] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** 仅用于缩小合作院校下拉框，不参与 API 查询 */
  const [region, setRegion] = useState("");

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
      setError("无法连接后端服务，请先启动 backend。");
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

  const onChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const goToFeedbackPage = () => {
    window.location.href = "/feedback";
  };

  return (
    <div className="container">
      <header className="header">
        <h1>港中深海外交流交换课程转学分查询系统</h1>
        <p>支持按地区与合作院校、课程关键词、港中深课程代码等检索课程转换关系。</p>
        <div className="headerActions">
          <button type="button" className="jumpFeedbackBtn" onClick={goToFeedbackPage}>
            我要提建议
          </button>
        </div>
      </header>

      <section className="filters">
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          {REGION_OPTIONS.map((r) => (
            <option key={r.id || "all"} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          value={filters.university}
          onChange={(e) => onChange("university", e.target.value)}
        >
          <option value="">全部合作院校</option>
          {universitiesInRegion.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <input
          placeholder="关键词（课程名/代码）"
          value={filters.keyword}
          onChange={(e) => onChange("keyword", e.target.value)}
        />

        <select value={filters.faculty} onChange={(e) => onChange("faculty", e.target.value)}>
          <option value="">全部归属学院</option>
          <option value="SDS">SDS</option>
          <option value="SSE">SSE</option>
          <option value="SME">SME</option>
          <option value="GE">GE</option>
        </select>

        <input
          placeholder="港中深课程代码（如 CSC1001）"
          value={filters.cuhkszCourseCode}
          onChange={(e) => onChange("cuhkszCourseCode", e.target.value)}
        />
      </section>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>加载中...</p>
      ) : (
        <section className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>合作院校</th>
                <th>对方课程</th>
                <th className="nowrap">归属学院</th>
                <th>港中深可认定课程</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>暂无匹配结果</td>
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

