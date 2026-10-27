"use client";

import AIChat from "../components/AIChat";
import styles from "./ai-chat.module.css";

export default function AIChatPage() {
  return (
    <main className={styles.page} dir="rtl" aria-label="محادثة مساعد NOVATEK الذكي">
      <AIChat embedded />
    </main>
  );
}
