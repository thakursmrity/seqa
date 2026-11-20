"use client";

const P = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  users: "M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21c0-4 4-6 8-6s8 2 8 6",
  board: "M4 4h5v16H4zM10 4h4v10h-4zM15 4h5v7h-5z",
  mail: "M3 6h18v12H3zM3 7l9 7 9-7",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  jobs: "M4 7h16v12H4zM9 7V4h6v3M4 12h16",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-2-4-2 1a7 7 0 00-2-1l-.5-2h-5L9 7a7 7 0 00-2 1l-2-1-2 4 2 1a7 7 0 000 2l-2 1 2 4 2-1a7 7 0 002 1l.5 2h5l.5-2a7 7 0 002-1l2 1 2-4-2-1a7 7 0 000-2z",
  send: "M4 12l16-8-6 16-2-7z",
  check: "M5 12l5 5 9-10",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5",
  doc: "M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  plus: "M12 5v14M5 12h14",
};

export function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] || P.spark} />
    </svg>
  );
}

// Seqa's mark: a soft gradient orb.
export function Orb({ size = 34 }) {
  return (
    <span className="orb" style={{ width: size, height: size }} aria-hidden="true">
      <i />
    </span>
  );
}

const HUES = [255, 285, 330, 20, 160, 195, 215];
export function Avatar({ name = "?", size = 36 }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = HUES[h % HUES.length];
  return (
    <span className="av" style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(135deg, hsl(${hue} 70% 62%), hsl(${(hue + 40) % 360} 70% 52%))` }}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function FitRing({ value, size = 36 }) {
  if (!value) return <span className="small">Not scored</span>;
  const r = 14, c = 2 * Math.PI * r, pct = Math.min(10, value) / 10;
  const color = value >= 8 ? "#2fa97c" : value >= 6 ? "#6d5df0" : "#e0a030";
  return (
    <span className="ring" style={{ width: size, height: size }} title={`Fit ${value} of 10`}>
      <svg viewBox="0 0 36 36" width={size} height={size}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--line)" strokeWidth="3.5" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 18 18)" />
      </svg>
      <b>{value}</b>
    </span>
  );
}

export const STATUS_COLOR = { new: "#8b87a0", researched: "#6d5df0", contacted: "#e0a030", replied: "#2fa97c", meeting: "#1aa3b8", client: "#d6479b" };
