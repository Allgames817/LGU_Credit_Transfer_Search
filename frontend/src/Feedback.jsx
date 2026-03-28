import { useState, useEffect } from "react";

import { API_BASE } from "./apiBase";
import { translations } from "./translations";

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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("language");
    return saved || "zh";
  });

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

  const t = translations[language];

  const submitSuggestion = async (e) => {
    e.preventDefault();
    const name = String(form.name || "").trim();
    const message = String(form.message || "").trim();

    setStatus({ loading: false, error: "", success: "" });
    if (!message) {
      setStatus({ loading: false, error: t.feedback.errorEmpty, success: "" });
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
      if (!res.ok) throw new Error(data?.message || t.feedback.errorSubmit);

      setForm({ name, message: "" });
      setStatus({ loading: false, error: "", success: t.feedback.successMessage });
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
      <div className="topControls">
        <button type="button" className="iconBtn" onClick={toggleDarkMode} title={darkMode ? t.darkModeTooltip.dark : t.darkModeTooltip.light}>
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button type="button" className="iconBtn" onClick={toggleLanguage} title={t.languageTooltip}>
          {language === "zh" ? "EN" : "中"}
        </button>
      </div>
      <header className="header">
        <h1>{t.feedback.title}</h1>
        <p>{t.feedback.subtitle}</p>
        <div className="headerActions">
          <button type="button" className="jumpFeedbackBtn" onClick={() => (window.location.href = "/")}>
            {t.feedback.backBtn}
          </button>
        </div>
      </header>

      <section className="feedbackCard">
        <form onSubmit={submitSuggestion} className="feedbackForm">
          <label>
            {t.feedback.nameLabel}
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t.feedback.namePlaceholder}
            />
          </label>
          <label>
            {t.feedback.messageLabel}
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              rows={6}
              required
            />
          </label>
          <button type="submit" disabled={status.loading}>
            {status.loading ? t.feedback.submitting : t.feedback.submitBtn}
          </button>
          {status.error && <p className="error">{status.error}</p>}
          {status.success && <p className="success">{status.success}</p>}
        </form>
      </section>
    </div>
  );
}

export default Feedback;

