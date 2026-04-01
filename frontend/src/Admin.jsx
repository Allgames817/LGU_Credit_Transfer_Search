import { useEffect, useMemo, useState } from "react";

import { API_BASE } from "./apiBase";
import { ADMIN_PARTNER_REGION_OPTIONS, getUniversityRegion } from "./universityRegions";
const TOKEN_KEY = "admin_token";
const ADMIN_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const ADMIN_PAGE_SIZE_STORAGE_KEY = "adminCoursesPageSize";

function readStoredAdminPageSize() {
  const n = Number(localStorage.getItem(ADMIN_PAGE_SIZE_STORAGE_KEY));
  return ADMIN_PAGE_SIZE_OPTIONS.includes(n) ? n : 25;
}

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
  const [announcement, setAnnouncement] = useState(null);
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const [announcementOk, setAnnouncementOk] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(readStoredAdminPageSize);
  const [jumpTablePage, setJumpTablePage] = useState("");

  const path = window.location.pathname || "/admin";
  const isAnnouncementPage = path.toLowerCase().startsWith("/admin/announcement");
  const isCoursesPage = path.toLowerCase().startsWith("/admin/courses") || path.toLowerCase() === "/admin";

  useEffect(() => {
    if (path.toLowerCase() === "/admin") {
      try {
        window.history.replaceState({}, "", "/admin/courses");
      } catch (_) {
        // ignore
      }
    }
  }, [path]);

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

  const loadAnnouncement = async () => {
    try {
      const res = await fetch(`${API_BASE}/announcement`);
      const data = await res.json();
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setAnnouncement(data);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) {
      setAdminToken(saved);
    }
  }, []);

  useEffect(() => {
    loadAnnouncement();
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

  const announcementForm = useMemo(() => {
    if (!announcement) {
      return {
        enabled: true,
        zhTitle: "",
        zhBody: "",
        enTitle: "",
        enBody: "",
      };
    }
    const zhBody = Array.isArray(announcement?.zh?.body) ? announcement.zh.body.join("\n") : "";
    const enBody = Array.isArray(announcement?.en?.body) ? announcement.en.body.join("\n") : "";
    return {
      enabled: announcement.enabled !== false,
      zhTitle: String(announcement?.zh?.title || ""),
      zhBody,
      enTitle: String(announcement?.en?.title || ""),
      enBody
    };
  }, [announcement]);

  const [announcementDraft, setAnnouncementDraft] = useState(announcementForm);

  useEffect(() => {
    // 当后端加载到公告时，重置草稿
    setAnnouncementDraft(announcementForm);
  }, [announcementForm]);

  const saveAnnouncement = async (e) => {
    e.preventDefault();
    setAnnouncementError("");
    setAnnouncementOk("");
    const token = String(adminToken).trim();
    if (!token) {
      setAnnouncementError("请输入管理员令牌。");
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, token);
    setAnnouncementSaving(true);
    try {
      const draft = announcementDraft || announcementForm;
      const body = {
        enabled: Boolean(draft.enabled),
        zh: {
          title: String(draft.zhTitle || "").trim(),
          body: String(draft.zhBody || "")
            .split(/\r?\n/g)
            .map((s) => s.trim())
            .filter(Boolean),
        },
        en: {
          title: String(draft.enTitle || "").trim(),
          body: String(draft.enBody || "")
            .split(/\r?\n/g)
            .map((s) => s.trim())
            .filter(Boolean),
        }
      };

      const res = await fetch(`${API_BASE}/announcement`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "保存失败");
      }
      const data = await res.json();
      setAnnouncement(data?.data || body);
      setAnnouncementOk("公告已保存。");
    } catch (err) {
      setAnnouncementError(String(err.message || err));
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const filteredRows = useMemo(() => {
    const selectedFaculty = String(filters.faculty || "").trim().toLowerCase();
    if (!selectedFaculty) return rows;
    return rows.filter((row) => String(row.faculty || "").trim().toLowerCase() === selectedFaculty);
  }, [rows, filters.faculty]);

  useEffect(() => {
    setTablePage(1);
  }, [filters.faculty, rows.length]);

  const tableTotalCount = filteredRows.length;
  const tableTotalPages = tableTotalCount === 0 ? 0 : Math.ceil(tableTotalCount / tablePageSize);
  const tableSafePage = tableTotalPages === 0 ? 1 : Math.min(tablePage, tableTotalPages);
  const tableRangeFrom = tableTotalCount === 0 ? 0 : (tableSafePage - 1) * tablePageSize + 1;
  const tableRangeTo =
    tableTotalCount === 0 ? 0 : Math.min(tableSafePage * tablePageSize, tableTotalCount);

  const paginatedRows = useMemo(() => {
    if (tableTotalCount === 0) return [];
    const start = (tableSafePage - 1) * tablePageSize;
    return filteredRows.slice(start, start + tablePageSize);
  }, [filteredRows, tableSafePage, tablePageSize, tableTotalCount]);

  const onAdminPageSizeChange = (n) => {
    setTablePageSize(n);
    setTablePage(1);
    localStorage.setItem(ADMIN_PAGE_SIZE_STORAGE_KEY, String(n));
  };

  useEffect(() => {
    setJumpTablePage(String(tableSafePage));
  }, [tableSafePage]);

  const commitJumpTablePage = () => {
    if (tableTotalPages <= 0) return;
    const raw = String(jumpTablePage || "").trim();
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setJumpTablePage(String(tableSafePage));
      return;
    }
    const next = Math.min(Math.max(1, Math.floor(n)), tableTotalPages);
    setTablePage(next);
    setJumpTablePage(String(next));
  };

  return (
    <div className="container">
      <header className="header">
        <h1>后台录入与维护</h1>
        <p>请选择页面：课程维护 / 公告管理 / 建议箱。</p>
        <div className="headerActions">
          <button
            type="button"
            className={isCoursesPage ? "jumpFeedbackBtn" : "githubBtn"}
            onClick={() => (window.location.href = "/admin/courses")}
          >
            课程维护
          </button>
          <button
            type="button"
            className={isAnnouncementPage ? "jumpFeedbackBtn" : "githubBtn"}
            onClick={() => (window.location.href = "/admin/announcement")}
          >
            公告管理
          </button>
          <button
            type="button"
            className={path.toLowerCase().startsWith("/admin/suggestions") ? "jumpFeedbackBtn" : "githubBtn"}
            onClick={() => (window.location.href = "/admin/suggestions")}
          >
            建议箱
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

      {isAnnouncementPage && (
      <section className="adminCard">
        <h2 className="adminTitle">公告管理（查询页顶部）</h2>
        <form className="adminForm" onSubmit={saveAnnouncement}>
          <label className="spanAll">
            是否启用
            <select
              value={announcementDraft.enabled ? "1" : "0"}
              onChange={(e) =>
                setAnnouncementDraft((prev) => ({ ...(prev || announcementForm), enabled: e.target.value === "1" }))
              }
            >
              <option value="1">启用</option>
              <option value="0">关闭</option>
            </select>
          </label>

          <label>
            中文标题
            <input
              value={announcementDraft.zhTitle || ""}
              onChange={(e) =>
                setAnnouncementDraft((prev) => ({ ...(prev || announcementForm), zhTitle: e.target.value }))
              }
            />
          </label>
          <label className="spanAll">
            中文正文（每行一段）
            <textarea
              rows={6}
              value={announcementDraft.zhBody || ""}
              onChange={(e) =>
                setAnnouncementDraft((prev) => ({ ...(prev || announcementForm), zhBody: e.target.value }))
              }
            />
          </label>

          <label>
            English title
            <input
              value={announcementDraft.enTitle || ""}
              onChange={(e) =>
                setAnnouncementDraft((prev) => ({ ...(prev || announcementForm), enTitle: e.target.value }))
              }
            />
          </label>
          <label className="spanAll">
            English body (one paragraph per line)
            <textarea
              rows={5}
              value={announcementDraft.enBody || ""}
              onChange={(e) =>
                setAnnouncementDraft((prev) => ({ ...(prev || announcementForm), enBody: e.target.value }))
              }
            />
          </label>

          {(announcementError || announcementOk) && (
            <p className={announcementError ? "error" : "success"}>
              {announcementError || announcementOk}
            </p>
          )}

          <div className="adminFormActions">
            <button type="submit" disabled={announcementSaving || !String(adminToken).trim()}>
              {announcementSaving ? "保存中..." : "保存公告"}
            </button>
          </div>
        </form>
      </section>
      )}

      {isCoursesPage && (
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
      )}

      {isCoursesPage && (
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
              {tableTotalCount === 0 ? (
                <tr>
                  <td colSpan={8}>暂无数据</td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
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

        {tableTotalCount > 0 && !loading && (
          <div className="queryPagination" role="navigation" aria-label="Pagination">
            <span className="queryPaginationSummary">
              共 {tableTotalCount} 条，显示第 {tableRangeFrom}–{tableRangeTo} 条
            </span>
            <span className="queryPaginationPageOf">
              第 {tableSafePage} / {tableTotalPages} 页
            </span>
            <label className="queryPaginationSize">
              <span>每页</span>
              <select
                value={tablePageSize}
                onChange={(e) => onAdminPageSizeChange(Number(e.target.value))}
              >
                {ADMIN_PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="queryPaginationSize" style={{ gap: 6 }}>
              <span>跳转</span>
              <input
                value={jumpTablePage}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(e) => setJumpTablePage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitJumpTablePage();
                }}
                onBlur={commitJumpTablePage}
                style={{ width: 90, padding: "6px 10px" }}
                aria-label="跳转到页码"
              />
              <span style={{ opacity: 0.85 }}>{` / ${tableTotalPages} 页`}</span>
            </label>
            <div className="queryPaginationNav">
              <button
                type="button"
                className="paginationBtn"
                disabled={tableSafePage <= 1}
                onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              >
                上一页
              </button>
              <button
                type="button"
                className="paginationBtn"
                disabled={tableSafePage >= tableTotalPages}
                onClick={() => setTablePage((p) => Math.min(tableTotalPages, p + 1))}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </section>
      )}
    </div>
  );
}

export default Admin;

