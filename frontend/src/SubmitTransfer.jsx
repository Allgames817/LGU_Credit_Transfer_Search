import { useEffect, useState } from "react";

import { API_BASE } from "./apiBase";
import { ADMIN_PARTNER_REGION_OPTIONS } from "./universityRegions";
import { translations } from "./translations";

const FACULTY_OPTIONS = ["", "SDS", "SSE", "SME", "GE"];

function SubmitTransfer() {
  const [form, setForm] = useState({
    submitterName: "",
    partnerUniversity: "",
    partnerRegion: "other",
    partnerCourseCode: "",
    partnerCourseName: "",
    partnerCredits: "",
    cuhkszCourseCode: "",
    cuhkszCourseName: "",
    cuhkszCredits: "",
    faculty: "",
    remark: ""
  });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "zh");

  useEffect(() => {
    if (darkMode) document.body.classList.add("dark-mode");
    else document.body.classList.remove("dark-mode");
  }, [darkMode]);

  const t = translations[language];
  const st = t.submitTransfer;

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    const partnerUniversity = String(form.partnerUniversity || "").trim();
    const partnerCourseCode = String(form.partnerCourseCode || "").trim();
    const partnerCourseName = String(form.partnerCourseName || "").trim();
    const cuhkszCourseCode = String(form.cuhkszCourseCode || "").trim();
    const cuhkszCourseName = String(form.cuhkszCourseName || "").trim();

    if (!partnerUniversity || !partnerCourseCode || !partnerCourseName || !cuhkszCourseCode || !cuhkszCourseName) {
      setStatus({ loading: false, error: st.errorRequired, success: "" });
      return;
    }

    const body = {
      submitterName: String(form.submitterName || "").trim(),
      partnerUniversity,
      partnerRegion: form.partnerRegion,
      partnerCourseCode,
      partnerCourseName,
      partnerCredits: form.partnerCredits === "" ? 0 : Number(form.partnerCredits),
      cuhkszCourseCode,
      cuhkszCourseName,
      cuhkszCredits: form.cuhkszCredits === "" ? 0 : Number(form.cuhkszCredits),
      faculty: String(form.faculty || "").trim(),
      remark: String(form.remark || "").trim()
    };

    try {
      const res = await fetch(`${API_BASE}/course-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || st.errorSubmit);

      setForm({
        submitterName: "",
        partnerUniversity: "",
        partnerRegion: "other",
        partnerCourseCode: "",
        partnerCourseName: "",
        partnerCredits: "",
        cuhkszCourseCode: "",
        cuhkszCourseName: "",
        cuhkszCredits: "",
        faculty: "",
        remark: ""
      });
      setStatus({ loading: false, error: "", success: st.successMessage });
    } catch (err) {
      setStatus({ loading: false, error: String(err?.message || err), success: "" });
    }
  };

  return (
    <div className="container">
      <div className="topControls">
        <button
          type="button"
          className="iconBtn"
          onClick={() => {
            const v = !darkMode;
            setDarkMode(v);
            localStorage.setItem("darkMode", String(v));
          }}
          title={darkMode ? t.darkModeTooltip.dark : t.darkModeTooltip.light}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button
          type="button"
          className="iconBtn"
          onClick={() => {
            const v = language === "zh" ? "en" : "zh";
            setLanguage(v);
            localStorage.setItem("language", v);
          }}
          title={t.languageTooltip}
        >
          {language === "zh" ? "EN" : "中"}
        </button>
      </div>

      <header className="header">
        <h1>{st.title}</h1>
        <p>{st.subtitle}</p>
        <div className="headerActions">
          <button type="button" className="jumpFeedbackBtn" onClick={() => (window.location.href = "/")}>
            {st.backBtn}
          </button>
        </div>
      </header>

      <section className="feedbackCard">
        <form onSubmit={submit} className="adminForm">
          <label>
            {st.nameLabel}
            <input value={form.submitterName} onChange={(e) => onChange("submitterName", e.target.value)} />
          </label>

          <label>
            {st.partnerUniversity}
            <input
              value={form.partnerUniversity}
              onChange={(e) => onChange("partnerUniversity", e.target.value)}
              required
            />
          </label>

          <label>
            {st.partnerRegion}
            <select value={form.partnerRegion} onChange={(e) => onChange("partnerRegion", e.target.value)}>
              {ADMIN_PARTNER_REGION_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            {st.partnerCourseCode}
            <input
              value={form.partnerCourseCode}
              onChange={(e) => onChange("partnerCourseCode", e.target.value)}
              required
            />
          </label>

          <label>
            {st.partnerCourseName}
            <input
              value={form.partnerCourseName}
              onChange={(e) => onChange("partnerCourseName", e.target.value)}
              required
            />
          </label>

          <label>
            {st.partnerCredits}
            <input
              type="number"
              step="0.1"
              value={form.partnerCredits}
              onChange={(e) => onChange("partnerCredits", e.target.value)}
            />
          </label>

          <label>
            {st.cuhkszCourseCode}
            <input
              value={form.cuhkszCourseCode}
              onChange={(e) => onChange("cuhkszCourseCode", e.target.value)}
              required
            />
          </label>

          <label>
            {st.cuhkszCourseName}
            <input
              value={form.cuhkszCourseName}
              onChange={(e) => onChange("cuhkszCourseName", e.target.value)}
              required
            />
          </label>

          <label>
            {st.cuhkszCredits}
            <input
              type="number"
              step="0.1"
              value={form.cuhkszCredits}
              onChange={(e) => onChange("cuhkszCredits", e.target.value)}
            />
          </label>

          <label>
            {st.faculty}
            <select value={form.faculty} onChange={(e) => onChange("faculty", e.target.value)}>
              {FACULTY_OPTIONS.map((f) => (
                <option key={f || "empty"} value={f}>
                  {f || st.facultyPlaceholder}
                </option>
              ))}
            </select>
          </label>

          <label className="spanAll">
            {st.remark}
            <textarea rows={4} value={form.remark} onChange={(e) => onChange("remark", e.target.value)} />
          </label>

          <button type="submit" disabled={status.loading}>
            {status.loading ? st.submitting : st.submitBtn}
          </button>
          {status.error && <p className="error">{status.error}</p>}
          {status.success && <p className="success">{status.success}</p>}
        </form>
      </section>
    </div>
  );
}

export default SubmitTransfer;
