import { useEffect, useMemo, useState } from "react";

import { API_BASE } from "./apiBase";
import { ADMIN_PARTNER_REGION_OPTIONS } from "./universityRegions";

const TOKEN_KEY = "admin_token";
const FACULTY_OPTIONS = ["", "SDS", "SSE", "SME", "GE"];

function emptyAuditForm(row) {
  return {
    partnerUniversity: row.partnerUniversity || "",
    partnerRegion: row.partnerRegion || "other",
    partnerCourseCode: row.partnerCourseCode || "",
    partnerCourseName: row.partnerCourseName || "",
    partnerCredits: row.partnerCredits ?? "",
    cuhkszCourseCode: row.cuhkszCourseCode || "",
    cuhkszCourseName: row.cuhkszCourseName || "",
    cuhkszCredits: row.cuhkszCredits ?? "",
    faculty: row.faculty || ""
  };
}

function AdminCourseReviews() {
  const [adminToken, setAdminToken] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [auditId, setAuditId] = useState(null);
  const [auditForm, setAuditForm] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) setAdminToken(saved);
  }, []);

  const path = window.location.pathname || "";

  const loadList = async () => {
    setError("");
    const token = String(adminToken).trim();
    if (!token) {
      setError("请输入管理员令牌。");
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, token);
    setLoading(true);
    try {
      const q = filterStatus ? `?status=${encodeURIComponent(filterStatus)}` : "";
      const res = await fetch(`${API_BASE}/course-submissions${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "加载失败");
      setRows(data.data || []);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const openAudit = (row) => {
    if (row.status !== "pending") return;
    setAuditId(row.id);
    setAuditForm(emptyAuditForm(row));
    setRejectReason("");
  };

  const closeAudit = () => {
    setAuditId(null);
    setAuditForm(null);
    setRejectReason("");
  };

  const submitApprove = async () => {
    if (auditId == null || !auditForm) return;
    const token = String(adminToken).trim();
    if (!token) {
      setError("请输入管理员令牌。");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const body = {
        ...auditForm,
        partnerCredits: auditForm.partnerCredits === "" ? 0 : Number(auditForm.partnerCredits),
        cuhkszCredits: auditForm.cuhkszCredits === "" ? 0 : Number(auditForm.cuhkszCredits)
      };
      const res = await fetch(`${API_BASE}/course-submissions/${auditId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "审核失败");
      closeAudit();
      await loadList();
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSubmission = async (row) => {
    const id = row.id;
    const extra =
      row.status === "approved"
        ? "\n\n注意：本条已通过审核时，仅从列表删除不会撤销已写入课程库的数据；如需撤销对应映射，请到「课程维护」手动删除该课程。"
        : "";
    const ok = window.confirm(`确定从列表中永久删除这条提交记录吗？此操作不可恢复。${extra}`);
    if (!ok) return;
    const token = String(adminToken).trim();
    if (!token) {
      setError("请输入管理员令牌。");
      return;
    }
    setError("");
    try {
      const res = await fetch(`${API_BASE}/course-submissions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "删除失败");
      if (Number(auditId) === Number(id)) closeAudit();
      await loadList();
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  const submitReject = async () => {
    if (auditId == null) return;
    const token = String(adminToken).trim();
    if (!token) {
      setError("请输入管理员令牌。");
      return;
    }
    if (!window.confirm("确定拒绝该条提交吗？")) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/course-submissions/${auditId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "操作失败");
      closeAudit();
      await loadList();
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setActionLoading(false);
    }
  };

  const auditingRow = useMemo(
    () => rows.find((r) => Number(r.id) === Number(auditId)) || null,
    [rows, auditId]
  );

  return (
    <div className="container">
      <header className="header">
        <h1>转学分案例审核</h1>
        <p>用户自助提交的已成功转学分课程，审核通过后将写入课程库（courses.js）。</p>
        <div className="headerActions">
          <button type="button" className="githubBtn" onClick={() => (window.location.href = "/admin/courses")}>
            课程维护
          </button>
          <button type="button" className="githubBtn" onClick={() => (window.location.href = "/admin/announcement")}>
            公告管理
          </button>
          <button type="button" className="githubBtn" onClick={() => (window.location.href = "/admin/suggestions")}>
            建议箱
          </button>
          <button
            type="button"
            className={path.toLowerCase().startsWith("/admin/reviews") ? "jumpFeedbackBtn" : "githubBtn"}
            onClick={() => (window.location.href = "/admin/reviews")}
          >
            转学分审核
          </button>
        </div>
      </header>

      <section className="adminCard">
        <h2 className="adminTitle">管理员令牌</h2>
        <div className="adminFormActions" style={{ alignItems: "end" }}>
          <label style={{ flex: 1 }}>
            请输入令牌
            <input value={adminToken} onChange={(e) => setAdminToken(e.target.value)} />
          </label>
          <button type="button" onClick={loadList} disabled={loading}>
            {loading ? "加载中..." : "加载列表"}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="adminCard">
        <h2 className="adminTitle">筛选</h2>
        <label>
          状态
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
            <option value="">全部</option>
          </select>
        </label>
      </section>

      {auditId != null && auditForm && auditingRow && (
        <section className="adminCard">
          <h2 className="adminTitle">审核提交 #{auditId}</h2>
          <p style={{ marginTop: 0, opacity: 0.85 }}>
            提交人：{auditingRow.submitterName || "匿名"} · 提交时间：
            {auditingRow.createdAt ? new Date(auditingRow.createdAt).toLocaleString() : "-"}
          </p>
          {auditingRow.remark ? (
            <p style={{ marginBottom: 12 }}>
              <strong>用户备注：</strong>
              {auditingRow.remark}
            </p>
          ) : null}
          <form
            className="adminForm"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <label>
              合作院校
              <input
                value={auditForm.partnerUniversity}
                onChange={(e) => setAuditForm((f) => ({ ...f, partnerUniversity: e.target.value }))}
              />
            </label>
            <label>
              地区
              <select
                value={auditForm.partnerRegion}
                onChange={(e) => setAuditForm((f) => ({ ...f, partnerRegion: e.target.value }))}
              >
                {ADMIN_PARTNER_REGION_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              对方课程代码
              <input
                value={auditForm.partnerCourseCode}
                onChange={(e) => setAuditForm((f) => ({ ...f, partnerCourseCode: e.target.value }))}
              />
            </label>
            <label>
              对方课程名称
              <input
                value={auditForm.partnerCourseName}
                onChange={(e) => setAuditForm((f) => ({ ...f, partnerCourseName: e.target.value }))}
              />
            </label>
            <label>
              对方学分
              <input
                type="number"
                step="0.1"
                value={auditForm.partnerCredits}
                onChange={(e) => setAuditForm((f) => ({ ...f, partnerCredits: e.target.value }))}
              />
            </label>
            <label>
              港中深课程代码
              <input
                value={auditForm.cuhkszCourseCode}
                onChange={(e) => setAuditForm((f) => ({ ...f, cuhkszCourseCode: e.target.value }))}
              />
            </label>
            <label>
              港中深课程名称
              <input
                value={auditForm.cuhkszCourseName}
                onChange={(e) => setAuditForm((f) => ({ ...f, cuhkszCourseName: e.target.value }))}
              />
            </label>
            <label>
              港中深学分
              <input
                type="number"
                step="0.1"
                value={auditForm.cuhkszCredits}
                onChange={(e) => setAuditForm((f) => ({ ...f, cuhkszCredits: e.target.value }))}
              />
            </label>
            <label>
              归属学院
              <select
                value={auditForm.faculty}
                onChange={(e) => setAuditForm((f) => ({ ...f, faculty: e.target.value }))}
              >
                {FACULTY_OPTIONS.map((f) => (
                  <option key={f || "e"} value={f}>
                    {f || "（空）"}
                  </option>
                ))}
              </select>
            </label>
            <label className="spanAll">
              拒绝原因（仅拒绝时填写）
              <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </label>
            <div className="adminFormActions">
              <button type="button" disabled={actionLoading} onClick={submitApprove}>
                {actionLoading ? "处理中…" : "通过并写入课程库"}
              </button>
              <button type="button" className="secondary danger" disabled={actionLoading} onClick={submitReject}>
                拒绝
              </button>
              <button type="button" className="secondary" disabled={actionLoading} onClick={closeAudit}>
                取消
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="tableWrap adminTable">
        <h2 className="adminTitle">提交列表</h2>
        {loading ? (
          <p style={{ padding: 12 }}>加载中...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>状态</th>
                <th>院校</th>
                <th>对方课程</th>
                <th>港中深</th>
                <th>学院</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>暂无数据</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.status}</td>
                    <td>{row.partnerUniversity}</td>
                    <td>
                      <strong>{row.partnerCourseCode}</strong>
                      <div>{row.partnerCourseName}</div>
                    </td>
                    <td>
                      <strong>{row.cuhkszCourseCode}</strong>
                      <div>{row.cuhkszCourseName}</div>
                    </td>
                    <td>{row.faculty || "-"}</td>
                    <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {row.status === "pending" ? (
                          <button type="button" onClick={() => openAudit(row)}>
                            审核
                          </button>
                        ) : row.status === "approved" ? (
                          <span>课程 ID {row.approvedCourseId ?? "—"}</span>
                        ) : (
                          <span title={row.rejectReason || ""}>已拒绝</span>
                        )}
                        <button
                          type="button"
                          className="secondary danger"
                          onClick={() => deleteSubmission(row)}
                        >
                          删除
                        </button>
                      </div>
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

export default AdminCourseReviews;
