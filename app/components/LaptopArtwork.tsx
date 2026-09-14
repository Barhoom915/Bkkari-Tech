type Props = { brand?: string | null; category?: string | null };

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const PALETTES = [
  { screen: "#123c63", accent: "#2e8bd8", body: "#0d2035" },
  { screen: "#0d2540", accent: "#ff8a1f", body: "#0b1f3a" },
  { screen: "#101d31", accent: "#5ca5ff", body: "#07111f" },
];

/**
 * رسمة توضيحية احترافية للابتوب -- تستخدم لحد ما تنضاف صور حقيقية.
 * مبنية بنفس هوية الموقع (كحلي غامق + أزرق + برتقالي)، مش صورة عامة.
 */
export default function LaptopArtwork({ brand, category }: Props) {
  const seed = hash(`${brand ?? ""}${category ?? ""}`);
  const palette = PALETTES[seed % PALETTES.length];
  const isGaming = (category ?? "").toLowerCase().includes("gam") || (category ?? "").includes("قيم");

  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" role="img" aria-label={brand ? `لابتوب ${brand}` : "لابتوب"}>
      <defs>
        <linearGradient id={`bg-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f4f7fb" />
          <stop offset="1" stopColor="#e4e9f1" />
        </linearGradient>
        <linearGradient id={`screen-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={palette.screen} />
          <stop offset="1" stopColor={palette.body} />
        </linearGradient>
        <filter id={`shadow-${seed}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#0b1f3a" floodOpacity=".18" />
        </filter>
      </defs>

      <rect width="400" height="300" fill={`url(#bg-${seed})`} />

      {/* شاشة اللابتوب */}
      <g filter={`url(#shadow-${seed})`}>
        <rect x="95" y="58" width="210" height="140" rx="14" fill={`url(#screen-${seed})`} />
        <rect x="107" y="70" width="186" height="116" rx="6" fill={palette.body} opacity="0.55" />
        {isGaming ? (
          <path d="M150 128h100M150 150h60" stroke={palette.accent} strokeWidth="6" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="200" cy="128" r="18" fill={palette.accent} opacity="0.9" />
            <path d="M150 165h100" stroke={palette.accent} strokeWidth="5" strokeLinecap="round" opacity="0.6" />
          </>
        )}
      </g>

      {/* قاعدة اللابتوب */}
      <path d="M70 210h260l18 34a8 8 0 0 1-7 12H59a8 8 0 0 1-7-12Z" fill={palette.body} />
      <rect x="180" y="210" width="40" height="5" rx="2.5" fill={palette.accent} opacity="0.7" />

      {/* لمسة برتقالية للعلامة */}
      <circle cx="330" cy="80" r="5" fill="#f0821e" opacity="0.85" />
    </svg>
  );
}
