import { useState } from "react";

const API_BASE = "http://localhost:4000/api";

function Feedback() {
  const [form, setForm] = useState({
    name: "",
    message: ""
  });
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: ""
  });

  const submitSuggestion = async (e) => {
    e.preventDefault();
    const name = String(form.name || "").trim();
    const message = String(form.message || "").trim();

    setStatus({ loading: false, error: "", success: "" });
    if (!message) {
      setStatus({ loading: false, error: "请先输入建议内容。", success: "" });
      return;
    }

    setStatus({ loading: true, error: "", success: "" });
    try {
      const res = await fetch(`${API_BASE}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "提交失败");

      setForm({ name, message: "" });
      setStatus({ loading: false, error: "", success: "建议已提交，感谢反馈！" });
    } catch (err) {
      setStatus({
        loading: false,
        error: String(err?.message || err),
        success: ""
      });
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>意见与建议</h1>
        <p>欢迎告诉我们你的使用体验、问题和改进建议。</p>
        <div className="headerActions">
          <button type="button" className="jumpFeedbackBtn" onClick={() => (window.location.href = "/")}>
            返回查询页面
          </button>
        </div>
      </header>

      <section className="feedbackCard">
        <form onSubmit={submitSuggestion} className="feedbackForm">
          <label>
            你的称呼（可选）
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="例如：2023级 金融专业同学"
            />
          </label>
          <label>
            建议内容
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              rows={6}
              required
            />
          </label>
          <button type="submit" disabled={status.loading}>
            {status.loading ? "提交中..." : "提交建议"}
          </button>
          {status.error && <p className="error">{status.error}</p>}
          {status.success && <p className="success">{status.success}</p>}
        </form>
      </section>
    </div>
  );
}

export default Feedback;

