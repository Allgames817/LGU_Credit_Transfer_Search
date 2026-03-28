import { useEffect, useMemo, useState } from "react";

import { API_BASE } from "./apiBase";
import { ADMIN_PARTNER_REGION_OPTIONS, getUniversityRegion } from "./universityRegions";
const TOKEN_KEY = "admin_token";

function emptyForm() {
  return {
    partnerUniversity: "",
    partnerRegion: "other",
    partnerCourseCode: "",
    partnerCourseName: "",
    partnerCredits: "",
    cuhkszCourseCode: "",
    cuhkszCourseName: "",
    cuhkszCredits: "",
    faculty: "",
    status: "pending"
  };
}

function Admin() {
  const [universities, setUniversities] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminToken, setAdminToken] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [filters, setFilters] = useState({
    faculty: ""
  });

  const loadUniversities = async () => {
    const res = await fetch(`${API_BASE}/universities`);
    const data = await res.json();
    setUniversities(data);
  };

  const loadCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/courses`);
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
    loadCourses();
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) {
      setAdminToken(saved);
    }
  }, []);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const token = String(adminToken).trim();

    if (!token) {
      setError("请输入管理员令牌。");
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, token);

    const body = {
      ...form,
      partnerCredits: form.partnerCredits === "" ? 0 : Number(form.partnerCredits),
      cuhkszCredits: form.cuhkszCredits === "" ? 0 : Number(form.cuhkszCredits)
    };

    try {
      if (editingId != null) {
        const res = await fetch(`${API_BASE}/courses/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "更新失败");
        }
      } else {
        const res = await fetch(`${API_BASE}/courses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "新增失败");
        }
      }

      setEditingId(null);
      setForm(emptyForm());
      await loadCourses();
      await loadUniversities();
    } catch (err) {
      setError(String(err.message || err));
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      partnerUniversity: row.partnerUniversity || "",
      partnerRegion: row.partnerRegion || getUniversityRegion(row.partnerUniversity),
      partnerCourseCode: row.partnerCourseCode || "",
      partnerCourseName: row.partnerCourseName || "",
      partnerCredits: row.partnerCredits ?? "",
      cuhkszCourseCode: row.cuhkszCourseCode || "",
      cuhkszCourseName: row.cuhkszCourseName || "",
      cuhkszCredits: row.cuhkszCredits ?? "",
      faculty: row.faculty || "",
      status: row.status || "pending"
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const remove = async (id) => {
    const ok = window.confirm("确定删除这条课程映射吗？");
    if (!ok) return;
    setError("");
    const token = String(adminToken).trim();
    if (!token) {
      setError("请输入管理员令牌。");
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, token);

    try {
      const res = await fetch(`${API_BASE}/courses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "删除失败");
      }
      await loadCourses();
    } catch (err) {
      setError(String(err.message || err));
    }
  };

  const heading = useMemo(() => {
    if (editingId == null) return "新增课程映射";
    return `编辑课程映射（ID: ${editingId}）`;
  }, [editingId]);

  const filteredRows = useMemo(() => {
    const selectedFaculty = String(filters.faculty || "").trim().toLowerCase();
    if (!selectedFaculty) return rows;
    return rows.filter((row) => String(row.faculty || "").trim().toLowerCase() === selectedFaculty);
  }, [rows, filters.faculty]);

  return (
    <div className="container">
      <header className="header">
        <h1>后台录入与维护</h1>
        <p>可新增/编辑/删除课程转学分映射数据。</p>
        <div className="headerActions">
          <button
            type="button"
            className="jumpFeedbackBtn"
            onClick={() => (window.location.href = "/admin/suggestions")}
          >
            查看用户建议
          </button>
        </div>
      </header>

      <section className="adminCard">
        <h2 className="adminTitle">管理员令牌</h2>
        <div className="adminFormActions" style={{ alignItems: "end" }}>
          <label style={{ flex: 1 }}>
            请输入令牌
            <input
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              placeholder="例如 dev-admin-token"
            />
          </label>
        </div>
      </section>

      <section className="adminCard">
        <h2 className="adminTitle">{heading}</h2>

        <form onSubmit={submit} className="adminForm">
          <label>
            合作院校
            <input
              list="university-list"
              value={form.partnerUniversity}
              onChange={(e) => onChange("partnerUniversity", e.target.value)}
              required
            />
            <datalist id="university-list">
              {universities.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>

          <label>
            地区
            <select
              value={form.partnerRegion}
              onChange={(e) => onChange("partnerRegion", e.target.value)}
            >
              {ADMIN_PARTNER_REGION_OPTIONS.map((r) => (
                <option key={r.id || "default"} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            对方课程代码
            <input
              value={form.partnerCourseCode}
              onChange={(e) => onChange("partnerCourseCode", e.target.value)}
              required
            />
          </label>

          <label>
            对方课程名称
            <input
              value={form.partnerCourseName}
              onChange={(e) => onChange("partnerCourseName", e.target.value)}
              required
            />
          </label>

          <label>
            对方课程学分
            <input
              type="number"
              step="0.1"
              value={form.partnerCredits}
              onChange={(e) => onChange("partnerCredits", e.target.value)}
            />
          </label>

          <label>
            港中深课程代码
            <input
              value={form.cuhkszCourseCode}
              onChange={(e) => onChange("cuhkszCourseCode", e.target.value)}
              required
            />
          </label>

          <label>
            港中深课程名称
            <input
              value={form.cuhkszCourseName}
              onChange={(e) => onChange("cuhkszCourseName", e.target.value)}
              required
            />
          </label>

          <label>
            港中深课程学分
            <input
              type="number"
              step="0.1"
              value={form.cuhkszCredits}
              onChange={(e) => onChange("cuhkszCredits", e.target.value)}
            />
          </label>

          <label>
            学院/归口
            <input value={form.faculty} onChange={(e) => onChange("faculty", e.target.value)} />
          </label>

          <label>
            审批状态
            <select value={form.status} onChange={(e) => onChange("status", e.target.value)}>
              <option value="approved">approved</option>
              <option value="pending">pending</option>
            </select>
          </label>

          {error && <p className="error">{error}</p>}

          <div className="adminFormActions">
            <button type="submit" disabled={!String(adminToken).trim()}>
              {editingId == null ? "新增" : "保存"}
            </button>
            {editingId != null && (
              <button type="button" onClick={cancelEdit} className="secondary">
                取消编辑
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="tableWrap adminTable">
        <h2 className="adminTitle">现有课程映射</h2>
        <div className="filters" style={{ marginBottom: 12 }}>
          <label>
            归属学院
            <select
              value={filters.faculty}
              onChange={(e) => setFilters((prev) => ({ ...prev, faculty: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="SDS">SDS</option>
              <option value="SSE">SSE</option>
              <option value="SME">SME</option>
              <option value="GE">GE</option>
            </select>
          </label>
        </div>
        {loading ? (
          <p style={{ padding: 12 }}>加载中...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>合作院校</th>
                <th className="nowrap">地区</th>
                <th className="nowrap">归属学院</th>
                <th>对方课程</th>
                <th>港中深课程</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8}>暂无数据</td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.partnerUniversity}</td>
                    <td>
                      {ADMIN_PARTNER_REGION_OPTIONS.find(
                        (o) =>
                          o.id === (row.partnerRegion || getUniversityRegion(row.partnerUniversity))
                      )?.label ?? "—"}
                    </td>
                    <td>{row.faculty || "-"}</td>
                    <td>
                      <strong>{row.partnerCourseCode}</strong>
                      <div>{row.partnerCourseName}</div>
                    </td>
                    <td>
                      <strong>{row.cuhkszCourseCode}</strong>
                      <div>{row.cuhkszCourseName}</div>
                    </td>
                    <td>
                      <span className={`tag ${row.status}`}>{row.status}</span>
                    </td>
                    <td>
                      <button type="button" onClick={() => startEdit(row)}>
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        className="secondary danger"
                        disabled={!String(adminToken).trim()}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Admin;

