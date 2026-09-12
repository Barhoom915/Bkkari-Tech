import type { SatofillProduct } from "@/app/lib/satofill";

type Theme = "pubg" | "freefire" | "gaming" | "chat" | "streaming" | "social" | "cards" | "ai" | "vpn" | "apps" | "other";

type ArtProfile = { theme: Theme; label: string; variant: number };

const rules: Array<[Theme, RegExp, string]> = [
  ["pubg", /(pubg|playerunknown|ببجي|ببج|p u b g)/i, "PUBG"],
  ["freefire", /(free\s*fire|garena|فري\s*فاير|فريفاير)/i, "FREE FIRE"],
  ["gaming", /(game|gaming|steam|playstation|xbox|roblox|fortnite|valorant|minecraft|riot|epic|لعب|ألعاب|العاب)/i, "GAMING"],
  ["chat", /(discord|telegram|whatsapp|viber|messenger|signal|imo|skype|zalo|wechat|chat|دردشة|دردش|شات|مراسلة|محادث)/i, "CHAT"],
  ["streaming", /(netflix|spotify|youtube|prime|shahid|osn|crunchyroll|stream|music|movie|film|نتفليكس|سبوتيفاي|يوتيوب|مشاهدة|موسيقى)/i, "STREAM"],
  ["social", /(tiktok|instagram|facebook|snapchat|twitter|x\.com|social|سوشال|سوشيل|انستغرام|فيسبوك|تيك\s*توك)/i, "SOCIAL"],
  ["cards", /(gift|card|voucher|itunes|google\s*play|play\s*store|بطاق|بطاقات|هدايا|قسيمة|روبلكس|ستور)/i, "CARD"],
  ["ai", /(chatgpt|gemini|claude|copilot|perplexity|artificial\s*intelligence|ذكاء\s*اصطناعي)/i, "AI"],
  ["vpn", /(vpn|nord|expressvpn|surfshark|proton\s*vpn)/i, "VPN"],
  ["apps", /(canva|office|adobe|windows|software|application|app|تطبيق|برنامج)/i, "APP"],
];

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function profile(product: SatofillProduct): ArtProfile {
  const text = `${product.name} ${(product.categories ?? []).join(" ")}`;
  const found = rules.find(([, re]) => re.test(text));
  const theme = found?.[0] ?? "other";
  return { theme, label: found?.[2] ?? "DIGITAL", variant: hash(`${product.id}|${product.name}`) % 6 };
}

const C = { navy: "#0F2A4A", blue: "#2E8BD8", orange: "#F0821E", pale: "#EAF4FC" };

function Character({ x = 65, y = 174, flip = false }: { x?: number; y?: number; flip?: boolean }) {
  return <g transform={`translate(${x} ${y}) ${flip ? "scale(-1 1)" : ""}`}>
    <circle cx="0" cy="-38" r="18" fill={C.navy}/>
    <path d="M-25 0c4-31 46-31 50 0Z" fill={C.navy}/>
    <path d="M14-32l29 11" stroke={C.orange} strokeWidth="7" strokeLinecap="round"/>
  </g>;
}

function Frame({ children }: { children: React.ReactNode }) {
  return <svg viewBox="0 0 360 250" className="h-full w-full" role="img" aria-label="Artwork للخدمة الرقمية">
    <defs><linearGradient id="sf-bg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor={C.pale}/></linearGradient><filter id="sf-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="9" stdDeviation="9" floodColor={C.navy} floodOpacity=".16"/></filter></defs>
    <rect width="360" height="250" rx="28" fill="url(#sf-bg)"/>
    <circle cx="42" cy="42" r="31" fill={C.blue} opacity=".09"/><circle cx="320" cy="205" r="48" fill={C.orange} opacity=".09"/>
    <path d="M20 210C95 170 125 225 195 188s105-32 145 7" fill="none" stroke={C.blue} opacity=".12" strokeWidth="3"/>
    {children}
  </svg>;
}

function BrandBadge({ children }: { children: React.ReactNode }) {
  return <g><rect x="20" y="18" width="112" height="30" rx="15" fill="#fff" stroke={C.blue} strokeOpacity=".2"/><text x="76" y="38" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.navy}>{children}</text></g>;
}

function Artwork({ p }: { p: ArtProfile }) {
  const v = p.variant;
  if (p.theme === "pubg") return <Frame><BrandBadge>PUBG</BrandBadge><g filter="url(#sf-shadow)"><rect x="122" y="68" width="128" height="102" rx="22" fill="#fff" stroke={C.navy} strokeWidth="4"/><rect x="139" y="84" width="94" height="53" rx="13" fill={C.pale}/><path d="M153 126l18-24 15 13 14-20 22 31Z" fill={C.blue} opacity=".85"/><circle cx="212" cy="100" r="7" fill={C.orange}/></g><Character x={74} y={181} flip={v % 2 === 0}/><path d="M90 143l35-34" stroke={C.orange} strokeWidth="8" strokeLinecap="round"/><circle cx="128" cy="105" r="7" fill={C.orange}/></Frame>;
  if (p.theme === "freefire") return <Frame><BrandBadge>FREE FIRE</BrandBadge><g filter="url(#sf-shadow)"><path d="M145 65h80l20 36-20 68h-80l-20-68Z" fill="#fff" stroke={C.navy} strokeWidth="4"/><path d="M148 91h74l12 22-12 36h-74l-12-36Z" fill={C.orange} opacity=".85"/><path d="M170 101l30 16-30 16Z" fill="#fff"/></g><Character x={70} y={182}/><path d="M88 145l40-25" stroke={C.blue} strokeWidth="8" strokeLinecap="round"/><circle cx="132" cy="117" r="7" fill={C.blue}/></Frame>;
  if (p.theme === "gaming") return <Frame><BrandBadge>GAMING</BrandBadge><g filter="url(#sf-shadow)"><rect x="108" y="82" width="145" height="72" rx="25" fill="#fff" stroke={C.navy} strokeWidth="4"/><circle cx="145" cy="118" r="16" fill={C.pale} stroke={C.blue} strokeWidth="5"/><path d="M137 118h16M145 110v16" stroke={C.navy} strokeWidth="4"/><circle cx="213" cy="109" r="6" fill={C.orange}/><circle cx="226" cy="121" r="6" fill={C.blue}/></g><Character x={70} y={180} flip={v % 2 === 1}/><path d="M87 142l25-17" stroke={C.orange} strokeWidth="8" strokeLinecap="round"/></Frame>;
  if (p.theme === "chat") return <Frame><BrandBadge>CHAT</BrandBadge><g filter="url(#sf-shadow)"><rect x="105" y="67" width="150" height="101" rx="25" fill="#fff" stroke={C.navy} strokeWidth="4"/><path d="M132 101h96M132 124h67" stroke={C.blue} strokeWidth="8" strokeLinecap="round"/><circle cx="219" cy="145" r="10" fill={C.orange}/></g><Character x={74} y={183}/><path d="M91 145l22 0" stroke={C.orange} strokeWidth="8" strokeLinecap="round"/></Frame>;
  if (p.theme === "streaming") return <Frame><BrandBadge>STREAM</BrandBadge><g filter="url(#sf-shadow)"><rect x="99" y="60" width="163" height="112" rx="19" fill="#fff" stroke={C.navy} strokeWidth="4"/><rect x="115" y="77" width="131" height="67" rx="12" fill={C.pale}/><path d="M169 91l34 19-34 19Z" fill={C.orange}/></g><Character x={72} y={184} flip={v % 2 === 0}/><path d="M90 145l18-14" stroke={C.blue} strokeWidth="8" strokeLinecap="round"/></Frame>;
  if (p.theme === "social") return <Frame><BrandBadge>SOCIAL</BrandBadge><g filter="url(#sf-shadow)"><rect x="112" y="65" width="137" height="103" rx="27" fill="#fff" stroke={C.navy} strokeWidth="4"/><circle cx="154" cy="105" r="18" fill={C.blue}/><circle cx="207" cy="105" r="18" fill={C.orange}/><path d="M143 137c22-17 54-17 77 0" fill="none" stroke={C.navy} strokeWidth="7" strokeLinecap="round"/></g><Character x={72} y={183}/><path d="M89 144l23 7" stroke={C.orange} strokeWidth="8" strokeLinecap="round"/></Frame>;
  if (p.theme === "cards") return <Frame><BrandBadge>CARD</BrandBadge><g filter="url(#sf-shadow)"><rect x="124" y="82" width="133" height="78" rx="15" fill={C.orange} transform="rotate(-7 124 82)"/><rect x="106" y="70" width="133" height="82" rx="16" fill="#fff" stroke={C.navy} strokeWidth="4"/><path d="M125 100h85M125 120h49" stroke={C.blue} strokeWidth="8" strokeLinecap="round"/><circle cx="207" cy="130" r="10" fill={C.orange}/></g><Character x={73} y={183} flip={v % 2 === 1}/></Frame>;
  if (p.theme === "ai") return <Frame><BrandBadge>AI</BrandBadge><g filter="url(#sf-shadow)"><rect x="108" y="70" width="145" height="99" rx="25" fill="#fff" stroke={C.navy} strokeWidth="4"/><circle cx="180" cy="117" r="29" fill={C.pale} stroke={C.blue} strokeWidth="4"/><path d="M166 117h28M180 103v28M180 87v-12M154 91l-9-9M206 91l9-9" stroke={C.orange} strokeWidth="5" strokeLinecap="round"/></g><Character x={73} y={183}/></Frame>;
  if (p.theme === "vpn") return <Frame><BrandBadge>VPN</BrandBadge><g filter="url(#sf-shadow)"><path d="M180 54l67 24v45c0 40-28 65-67 80-39-15-67-40-67-80V78Z" fill="#fff" stroke={C.navy} strokeWidth="4"/><path d="M180 82l34 14v26c0 21-14 36-34 46-20-10-34-25-34-46V96Z" fill={C.pale}/><path d="M165 117l11 11 24-28" fill="none" stroke={C.orange} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/></g><Character x={73} y={184} flip={v % 2 === 0}/></Frame>;
  if (p.theme === "apps") return <Frame><BrandBadge>APP</BrandBadge><g filter="url(#sf-shadow)"><rect x="132" y="52" width="95" height="145" rx="23" fill="#fff" stroke={C.navy} strokeWidth="4"/><rect x="149" y="77" width="27" height="27" rx="7" fill={C.blue}/><rect x="184" y="77" width="27" height="27" rx="7" fill={C.orange}/><rect x="149" y="113" width="27" height="27" rx="7" fill={C.orange}/><rect x="184" y="113" width="27" height="27" rx="7" fill={C.blue}/><path d="M157 169h45" stroke={C.navy} strokeWidth="6" strokeLinecap="round"/></g><Character x={73} y={183}/></Frame>;
  return <Frame><BrandBadge>DIGITAL</BrandBadge><g filter="url(#sf-shadow)"><rect x="110" y="70" width="145" height="99" rx="24" fill="#fff" stroke={C.navy} strokeWidth="4"/><circle cx="181" cy="117" r="30" fill={C.pale}/><path d="M166 117h30M181 102v30" stroke={v % 2 ? C.orange : C.blue} strokeWidth="7" strokeLinecap="round"/><circle cx="222" cy="145" r="9" fill={C.orange}/></g><Character x={73} y={183} flip={v % 2 === 1}/></Frame>;
}

export default function ProductArtwork({ product }: { product: SatofillProduct }) {
  // إذا في صورة مخصصة (منتج أو مجموعة) محلولة مسبقاً بـ thumbnail، استخدمها -- وإلا رسمة توضيحية بديلة
  if (product.thumbnail) {
    return <div className="h-full w-full"><img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" /></div>;
  }
  const p = profile(product);
  return <div className="h-full w-full"><Artwork p={p} /></div>;
}
