"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase-browser";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import AIChat from "@/app/components/AIChat";

type ContactChannel = {
  name: string;
  icon: string;
  href: string;
  text: string;
  value?: string;
};

const defaults: ContactChannel[] = [
  { name: "واتساب", icon: "whatsapp", href: "https://wa.me/963936426605", text: "رد مباشر وسريع", value: "0936426605" },
  { name: "تيليغرام", icon: "telegram", href: "https://t.me/NexCode9", text: "تواصل عبر تيليغرام", value: "@NexCode9" },
  { name: "فيسبوك", icon: "facebook", href: "https://www.facebook.com/share/1BZU7LUd2o/", text: "صفحة NOVATEK على فيسبوك", value: "NOVATEK" },
  { name: "الإيميل", icon: "mail", href: "mailto:ibrahimbkkari51@gmail.com", text: "للاستفسارات والطلبات", value: "ibrahimbkkari51@gmail.com" },
];

export default function ContactPage() {
  const [aiOpen, setAiOpen] = useState(false);
  const [channels, setChannels] = useState(defaults);

  useEffect(() => {
    createClient()
      .from("site_settings")
      .select("value")
      .eq("key", "contact")
      .maybeSingle()
      .then((result: { data: { value: unknown } | null }) => {
        const c = result.data?.value as Record<string, unknown> | null;
        if (!c) return;

        setChannels([
          {
            ...defaults[0],
            href: typeof c.whatsapp === "string" && c.whatsapp ? `https://wa.me/${c.whatsapp}` : defaults[0].href,
            value: typeof c.phone === "string" && c.phone ? c.phone : defaults[0].value,
          },
          {
            ...defaults[1],
            href: typeof c.telegram === "string" && c.telegram ? `https://t.me/${c.telegram.replace(/^@/, "")}` : defaults[1].href,
            value: typeof c.telegram === "string" && c.telegram ? c.telegram : defaults[1].value,
          },
          {
            ...defaults[2],
            href: typeof c.facebook === "string" && c.facebook ? c.facebook : defaults[2].href,
          },
          {
            ...defaults[3],
            href: typeof c.email === "string" && c.email ? `mailto:${c.email}` : defaults[3].href,
            value: typeof c.email === "string" && c.email ? c.email : defaults[3].value,
          },
        ]);
      });
  }, []);

  return (
    <>
      <Header />
      <main className="info-page novatek-contact-page" dir="rtl">
        <div className="info-wrap">
          <section className="novatek-contact-hero">
            <div>
              <span>CONTACT / SUPPORT</span>
              <h1>تواصل معنا</h1>
              <p>كل طرق التواصل مع NOVATEK بمكان واحد — اختار الطريقة اللي بتناسبك.</p>
            </div>
            <div className="novatek-contact-hero-badge">
              <b>دعم NOVATEK</b>
              <small>متواجدين لمساعدتك</small>
            </div>
          </section>

          <section className="novatek-contact-layout">
            <button onClick={() => setAiOpen(true)} className="contact-ai-card novatek-ai-contact-card">
              <div className="novatek-contact-icon ai-icon">✦</div>
              <div className="novatek-contact-card-copy">
                <span>AI ASSISTANT</span>
                <h2>شات مباشر مع المساعد</h2>
                <p>اسأل عن اللابتوبات، الخدمات، الطلبات ومعلومات المتجر.</p>
              </div>
              <b className="novatek-contact-arrow">←</b>
            </button>

            <div className="novatek-contact-channels">
              {channels.map((channel) => (
                <a
                  key={channel.name}
                  href={channel.href}
                  target={channel.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className={`novatek-contact-channel ${channel.icon === "whatsapp" ? "is-whatsapp" : ""}`}
                >
                  <div className="novatek-contact-icon">
                    <img src={`/social/${channel.icon}.svg`} alt="" aria-hidden="true" />
                  </div>
                  <div className="novatek-contact-card-copy">
                    <h2>{channel.name}</h2>
                    <p>{channel.text}</p>
                    {channel.value && <small>{channel.value}</small>}
                  </div>
                  <span className="novatek-contact-arrow">←</span>
                </a>
              ))}
            </div>
          </section>

          <section className="support-note novatek-support-note">
            <div>
              <span>SUPPORT TEAM</span>
              <h2>بدك تحكي مع شخص من الفريق؟</h2>
              <p>واتساب هو الأسرع، وباقي القنوات موجودة إذا بتفضّل طريقة ثانية.</p>
            </div>
            <a href={channels[0]?.href || defaults[0].href} target="_blank" rel="noreferrer">تواصل عبر واتساب ←</a>
          </section>
        </div>
      </main>

      {aiOpen && (
        <div className="contact-ai-overlay" onClick={() => setAiOpen(false)}>
          <div onClick={(event) => event.stopPropagation()} className="contact-ai-modal">
            <button onClick={() => setAiOpen(false)} className="contact-ai-close" aria-label="إغلاق">×</button>
            <AIChat embedded />
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
