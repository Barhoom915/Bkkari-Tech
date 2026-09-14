import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./lib/cart-context";

export const metadata: Metadata = {
  title: "Bkkari Tech | بكاري تيك — كل احتياجاتك التقنية بمكان واحد",
  description:
    "لابتوبات بمختلف الفئات، شحن ألعاب وخدمات رقمية، وتصميم وبرمجة مواقع. توصيل لباب المنزل وشحن لكل المحافظات السورية.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-base)] text-ink antialiased"><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("bkkari-theme");document.documentElement.classList.remove("dark");if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})()` }} />
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
