import { useEffect, useMemo, useState } from "react";

import { API_BASE } from "./apiBase";
const TOKEN_KEY = "admin_token";

function AdminSuggestions() {
  const [adminToken, setAdminToken] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState("all");

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) setAdminToken(saved);
  }, []);

  const loadSuggestions = async () => {
    setError("");
    const token = String(adminToken).trim();
    if (!token) {
      setError("请输入管理员令牌。");
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, token);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/suggestions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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

  const deleteOne = async (id) => {
    const token = String(adminToken).trim();
    if (!token) {
      setError("请输入管理员令牌。");
      return;
    }
    const ok = window.confirm("确定删除这条建议吗？");
    if (!ok) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/suggestions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "删除失败");
      setRows((prev) => prev.filter((r) => Number(r.id) !== Number(id)));
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  const clearAll = async () => {
    const token = String(adminToken).trim();
    if (!token) {
      setError("请输入管理员令牌。");
      return;
    }
    const ok = window.confirm("确定清空全部建议吗？此操作不可恢复。");
    if (!ok) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/suggestions`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "清空失败");
      setRows([]);
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  const exportCsv = () => {
    if (filteredRows.length === 0) {
      setError("当前没有可导出的建议。");
      return;
    }

    const escapeCell = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const header = ["id", "name", "message", "createdAt"];
    const lines = [
      header.map(escapeCell).join(","),
      ...filteredRows
        .slice()
        .reverse()
        .map((row) =>
          [row.id, row.name || "匿名用户", row.message || "", row.createdAt || ""]
            .map(escapeCell)
            .join(",")
        )
    ];

    const csv = "\ufeff" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const time = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `suggestions-${time}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredRows = useMemo(() => {
    if (range === "all") return rows;
    const now = Date.now();
    const days = Number(range);
    if (!Number.isFinite(days) || days <= 0) return rows;
    const threshold = now - days * 24 * 60 * 60 * 1000;
    return rows.filter((row) => {
      const t = new Date(row.createdAt || "").getTime();
      return Number.isFinite(t) && t >= threshold;
    });
  }, [rows, range]);

  return (
    <div className="container">
      <header className="header">
        <h1>管理员建议箱</h1>
        <p>查看用户提交的意见与建议。</p>
        <div className="headerActions">
          <button type="button" className="githubBtn" onClick={() => (window.location.href = "/admin/courses")}>
            课程维护
          </button>
          <button type="button" className="githubBtn" onClick={() => (window.location.href = "/admin/announcement")}>
            公告管理
          </button>
          <button type="button" className="jumpFeedbackBtn" onClick={() => (window.location.href = "/admin/suggestions")}>
            建议箱
          </button>
          <button type="button" className="githubBtn" onClick={() => (window.location.href = "/admin/reviews")}>
            转学分审核
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
            />
          </label>
          <button type="button" onClick={loadSuggestions} disabled={loading}>
            {loading ? "加载中..." : "加载建议"}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="tableWrap adminTable">
        <h2 className="adminTitle">用户建议列表</h2>
        <div style={{ padding: "0 0 12px" }}>
          <label style={{ marginRight: 8 }}>
            时间范围
            <select value={range} onChange={(e) => setRange(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="all">全部</option>
              <option value="7">近7天</option>
              <option value="30">近30天</option>
            </select>
          </label>
          <button type="button" className="secondary" onClick={exportCsv} disabled={loading}>
            导出 CSV
          </button>
          <button type="button" className="secondary danger" onClick={clearAll} disabled={loading}>
            清空全部建议
          </button>
        </div>
        {loading ? (
          <p style={{ padding: 12 }}>加载中...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>称呼</th>
                <th>建议内容</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>暂无建议</td>
                </tr>
              ) : (
                filteredRows
                  .slice()
                  .reverse()
                  .map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.name || "匿名用户"}</td>
                      <td>{row.message}</td>
                      <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary danger"
                          onClick={() => deleteOne(row.id)}
                          disabled={loading}
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

export default AdminSuggestions;

