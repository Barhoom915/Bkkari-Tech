"use client";

import { useEffect, useState } from "react";

export default function ThemeLanguageControls({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("novatek-theme");
    const next = saved === "dark";
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("novatek-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    window.dispatchEvent(new CustomEvent("novatek-theme-change", { detail: next ? "dark" : "light" }));
  }

  return (
    <button type="button" onClick={toggleTheme} aria-label={dark ? "الوضع الفاتح" : "الوضع الداكن"} title={dark ? "الوضع الفاتح" : "الوضع الداكن"} className={`theme-toggle ${compact ? "compact" : ""} ${dark ? "is-dark" : ""}`}>
      <span className="theme-toggle-icon">{dark ? "☀" : "☾"}</span>
      <span className="theme-toggle-label">{dark ? "فاتح" : "داكن"}</span>
    </button>
  );
}
