"use client";

import { useEffect, useState } from "react";

export default function ThemeLanguageControls({ compact = false }: { compact?: boolean }) {
  const [english, setEnglish] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("bkkari-lang");
    const nextEnglish = savedLang === "en";
    setEnglish(nextEnglish);
    document.documentElement.classList.remove("dark");
    localStorage.setItem("bkkari-theme", "light");
    document.documentElement.dir = nextEnglish ? "ltr" : "rtl";
    document.documentElement.lang = nextEnglish ? "en" : "ar";
  }, []);

  function toggleLanguage() {
    const next = !english;
    setEnglish(next);
    localStorage.setItem("bkkari-lang", next ? "en" : "ar");
    document.documentElement.dir = next ? "ltr" : "rtl";
    document.documentElement.lang = next ? "en" : "ar";
    window.dispatchEvent(new CustomEvent("bkkari-language-change", { detail: next ? "en" : "ar" }));
  }

  return (
    <div className={`flex items-center gap-1.5 ${compact ? "" : "gap-2"}`}>
      <button
        type="button"
        onClick={toggleLanguage}
        aria-label="تبديل اللغة"
        title="تبديل اللغة"
        className="language-control"
      >
        {english ? "AR" : "EN"}
      </button>
    </div>
  );
}
