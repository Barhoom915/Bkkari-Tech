export default function CircuitBg({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="#2e8bd8" strokeOpacity="0.12" strokeWidth="2">
        <path d="M0 80 H160 V180 H320" />
        <path d="M800 60 H620 V220 H480" />
        <path d="M0 420 H120 V520 H260" />
        <path d="M800 500 H660 V400 H540" />
        <path d="M400 0 V90" />
        <path d="M400 600 V510" />
      </g>
      <g fill="#f0821e" fillOpacity="0.55">
        <circle cx="160" cy="80" r="4" />
        <circle cx="320" cy="180" r="4" />
        <circle cx="620" cy="60" r="4" />
        <circle cx="480" cy="220" r="4" />
        <circle cx="120" cy="420" r="4" />
        <circle cx="260" cy="520" r="4" />
        <circle cx="660" cy="500" r="4" />
        <circle cx="540" cy="400" r="4" />
      </g>
    </svg>
  );
}
