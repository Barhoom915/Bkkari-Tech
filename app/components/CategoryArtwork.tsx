import type { SatofillCategory } from "@/app/lib/satofill";

type Kind = "games" | "apps" | "chat" | "subscriptions" | "cards" | "software" | "web" | "other";

function kindFor(category: SatofillCategory): Kind {
  const value = `${category.name} ${category.slug ?? ""} ${category.description ?? ""}`.toLowerCase();
  if (/(game|gaming|play|لعب|ألعاب|العاب|قيمنغ|قيمنج)/.test(value)) return "games";
  if (/(app|application|تطبيق)/.test(value)) return "apps";
  if (/(chat|social|messag|discord|telegram|دردش|تواصل|سوشال)/.test(value)) return "chat";
  if (/(sub|subscription|membership|اشتراك|عضوية)/.test(value)) return "subscriptions";
  if (/(card|gift|voucher|بطاق|بطاقات|هدايا)/.test(value)) return "cards";
  if (/(software|windows|office|program|برنامج|برامج)/.test(value)) return "software";
  if (/(web|website|design|موقع|مواقع|تصميم|برمجة)/.test(value)) return "web";
  return "other";
}

const stroke = "#0F2A4A";
const blue = "#2E8BD8";
const orange = "#F0821E";
const light = "#EAF4FC";

function Illustration({ kind }: { kind: Kind }) {
  if (kind === "games") return <>
    <rect x="10" y="22" width="76" height="42" rx="18" fill={light} stroke={stroke} strokeWidth="3" />
    <path d="M31 43h14M38 36v14" stroke={blue} strokeWidth="4" strokeLinecap="round" />
    <circle cx="66" cy="39" r="4" fill={orange} /><circle cx="76" cy="48" r="4" fill={blue} />
    <path d="M21 63l7-12M75 63l-7-12" stroke={orange} strokeWidth="5" strokeLinecap="round" />
  </>;
  if (kind === "apps") return <>
    <rect x="27" y="7" width="44" height="78" rx="10" fill={light} stroke={stroke} strokeWidth="3" />
    <rect x="35" y="20" width="12" height="12" rx="3" fill={blue} /><rect x="51" y="20" width="12" height="12" rx="3" fill={orange} />
    <rect x="35" y="36" width="12" height="12" rx="3" fill={orange} /><rect x="51" y="36" width="12" height="12" rx="3" fill={blue} />
    <rect x="35" y="52" width="28" height="10" rx="4" fill="#fff" stroke={blue} strokeWidth="2" />
    <circle cx="49" cy="74" r="3" fill={stroke} />
  </>;
  if (kind === "chat") return <>
    <path d="M13 26c0-9 8-16 18-16h24c10 0 18 7 18 16v16c0 9-8 16-18 16H36l-13 11 3-13c-8-3-13-9-13-18V26Z" fill={light} stroke={stroke} strokeWidth="3" />
    <circle cx="36" cy="34" r="4" fill={blue} /><circle cx="49" cy="34" r="4" fill={orange} /><circle cx="62" cy="34" r="4" fill={blue} />
    <path d="M57 55c10 0 17 6 17 15v4l-8-5H52c-7 0-12-5-12-11" fill="#fff" stroke={orange} strokeWidth="3" />
  </>;
  if (kind === "subscriptions") return <>
    <rect x="16" y="17" width="68" height="54" rx="12" fill={light} stroke={stroke} strokeWidth="3" />
    <path d="M16 31h68" stroke={blue} strokeWidth="3" />
    <circle cx="31" cy="24" r="3" fill={orange} /><circle cx="41" cy="24" r="3" fill={blue} />
    <path d="M50 46l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1 4-8Z" fill={orange} stroke={stroke} strokeWidth="2" />
  </>;
  if (kind === "cards") return <>
    <rect x="18" y="22" width="57" height="42" rx="9" fill="#fff" stroke={stroke} strokeWidth="3" transform="rotate(-8 18 22)" />
    <rect x="27" y="29" width="57" height="42" rx="9" fill={light} stroke={blue} strokeWidth="3" transform="rotate(7 27 29)" />
    <path d="M40 43h27M40 51h18" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
    <path d="M67 17l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill={orange} />
  </>;
  if (kind === "software") return <>
    <rect x="15" y="13" width="70" height="57" rx="9" fill={light} stroke={stroke} strokeWidth="3" />
    <rect x="15" y="13" width="70" height="12" rx="9" fill={blue} />
    <circle cx="25" cy="19" r="2" fill="#fff" /><circle cx="32" cy="19" r="2" fill="#fff" />
    <path d="M28 39h15M28 49h29M28 59h20" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
    <path d="M69 47l5 5-9 9-5-5 9-9Z" fill={orange} />
  </>;
  if (kind === "web") return <>
    <rect x="13" y="18" width="74" height="50" rx="8" fill="#fff" stroke={stroke} strokeWidth="3" />
    <rect x="13" y="18" width="74" height="11" rx="8" fill={blue} />
    <circle cx="23" cy="23.5" r="2" fill="#fff" /><circle cx="30" cy="23.5" r="2" fill="#fff" />
    <path d="M29 45l-8 7 8 7M51 45l8 7-8 7M45 39l-10 26" stroke={orange} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>;
  return <>
    <rect x="18" y="18" width="64" height="56" rx="14" fill={light} stroke={stroke} strokeWidth="3" />
    <circle cx="50" cy="45" r="14" fill="#fff" stroke={blue} strokeWidth="3" />
    <path d="M50 36v18M41 45h18" stroke={orange} strokeWidth="4" strokeLinecap="round" />
  </>;
}

export default function CategoryArtwork({ category }: { category: SatofillCategory }) {
  const kind = kindFor(category);
  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-[#DCEAF6] bg-gradient-to-br from-white via-[#F4F9FD] to-[#EAF4FC] shadow-[0_10px_28px_rgba(15,42,74,0.08)]">
      <div className="absolute -right-5 -top-5 h-12 w-12 rounded-full bg-orange/10 blur-xl" />
      <div className="absolute -bottom-5 -left-5 h-12 w-12 rounded-full bg-blue/10 blur-xl" />
      <svg viewBox="0 0 100 100" className="relative h-[72px] w-[72px] transition-transform duration-300 group-hover:scale-105" fill="none">
        <Illustration kind={kind} />
      </svg>
    </div>
  );
}
