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

// Original geometric glyphs on a 24 x 24 grid, drawn in a single tone.
export const SHAPES = {
  rings: <><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /></>,
  peaks: <path d="M2.5 19L9 6l4.2 8L16 10l5.5 9z" fill="currentColor" />,
  orbit: <><ellipse cx="12" cy="12" rx="9.5" ry="4.5" transform="rotate(-30 12 12)" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="3.4" fill="currentColor" /></>,
  diamond: <><path d="M12 2.5L21.5 12 12 21.5 2.5 12z" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 7.5L16.5 12 12 16.5 7.5 12z" fill="currentColor" /></>,
  hex: <><path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="3" fill="currentColor" /></>,
  halves: <><path d="M3 11a9 9 0 0118 0z" fill="currentColor" /><path d="M21 13a9 9 0 01-18 0z" fill="currentColor" opacity=".55" /></>,
  dots: <>{[6, 12, 18].flatMap((x) => [6, 12, 18].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.9" fill="currentColor" />))}</>,
  wave: <>{[7, 12, 17].map((y) => <path key={y} d={`M3 ${y}q4.5-5 9 0t9 0`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />)}</>,
  bars: <>{[[4, 12], [9, 5], [14, 9], [19, 15]].map(([x, h], i) => <rect key={i} x={x - 1.5} y={20 - h} width="3.2" height={h} rx="1.6" fill="currentColor" />)}</>,
  arcs: <><path d="M3 12V3a9 9 0 019 9z" fill="currentColor" /><path d="M21 12v9a9 9 0 01-9-9z" fill="currentColor" /><path d="M12 3v0M3 21a9 9 0 019-9v9z" fill="currentColor" opacity=".55" /><path d="M21 3a9 9 0 00-9 9h9z" fill="currentColor" opacity=".55" /></>,
  chevrons: <>{[6, 11, 16].map((y) => <path key={y} d={`M4 ${y + 2}l8-6 8 6`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />)}</>,
  frame: <><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="8" y="8" width="8" height="8" rx="2" fill="currentColor" /></>,
};
export const AVATAR_SHAPES = ["", ...Object.keys(SHAPES)];
export const AVATAR_BGS = ["#4a5a7e", "#2f7f86", "#7a4f8f", "#6b5bd6", "#5f8f70", "#c26a52", "#243656", "#b04e75"];

// A professional avatar: a shape or initial on a calm solid colour.
export function Avatar({ name = "?", size = 36, shape, bg }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const fill = bg || AVATAR_BGS[h % AVATAR_BGS.length];
  return (
    <span className="av" style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(145deg, color-mix(in srgb, ${fill} 82%, #fff), ${fill})` }}>
      {SHAPES[shape] ? (
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" style={{ color: "#fffdf8" }} aria-hidden="true">{SHAPES[shape]}</svg>
      ) : (
        name.trim().charAt(0).toUpperCase()
      )}
    </span>
  );
}

export function FitRing({ value, size = 36 }) {
  if (!value) return <span className="small">Not scored</span>;
  const r = 14, c = 2 * Math.PI * r, pct = Math.min(10, value) / 10;
  const color = value >= 8 ? "#2fa97c" : value >= 6 ? "#6d5df0" : "#a64dd8";
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

export const STATUS_COLOR = { new: "#8b87a0", researched: "#6d5df0", contacted: "#a64dd8", replied: "#2fa97c", meeting: "#1aa3b8", client: "#d6479b" };
