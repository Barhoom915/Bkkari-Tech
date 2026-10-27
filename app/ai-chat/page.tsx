import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIChat from "../components/AIChat";
import styles from "./ai-chat.module.css";

export const metadata: Metadata = {
  title: "مساعد NOVATEK الذكي",
  description: "اسأل مساعد NOVATEK عن اللابتوبات والخدمات الرقمية واختر الأنسب لاحتياجك وميزانيتك.",
};

export default function AIChatPage() {
  return (
    <>
      <Header />
      <main className={styles.page} dir="rtl">
        <div className={styles.wrap}>
          <section className={styles.intro}>
            <span className={styles.eyebrow}>✨ NOVATEK SMART ASSISTANT</span>
            <h1>خلّينا نلاقي الأنسب إلك 💻</h1>
            <p>اسأل عن اللابتوبات، الألعاب، أو خدماتنا الرقمية — وبنساعدك تختار بناءً على المعلومات المتوفرة بالمتجر.</p>
          </section>
          <AIChat embedded />
        </div>
      </main>
      <Footer />
    </>
  );
}
