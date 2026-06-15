/* Lightweight, dependency-free charts (render fine in server components). */
import React from 'react';

const PALETTE = ['#FF5A1F', '#F59E0B', '#0E9488', '#1F9D55', '#C98A14', '#E0533D', '#3B82F6', '#7C7167'];

export function Sparkline({ data = [], color = '#FF5A1F', width = 140, height = 38 }) {
  const vals = data.length ? data : [0, 0];
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0);
  const span = max - min || 1;
  const stepX = width / Math.max(vals.length - 1, 1);
  const pts = vals.map((v, i) => [i * stepX, height - ((v - min) / span) * (height - 6) - 3]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L ${width} ${height} L 0 ${height} Z`;
  const gid = 'sg' + color.replace('#', '');
  return (
    <svg className="kpi-spark" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.28" /><stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AreaChart({ data = [], labels = [], color = '#FF5A1F', height = 230 }) {
  const W = 760, H = height, padB = 26, padL = 32, padT = 12;
  const vals = data.length ? data : [0];
  const max = Math.max(...vals, 1);
  const stepX = (W - padL) / Math.max(vals.length - 1, 1);
  const y = (v) => padT + (1 - v / max) * (H - padB - padT);
  const x = (i) => padL + i * stepX;
  const pts = vals.map((v, i) => [x(i), y(v)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L ${x(vals.length - 1)} ${H - padB} L ${padL} ${H - padB} Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg className="chart-wrap" width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.30" /><stop offset="100%" stopColor={color} stopOpacity="0.02" />
      </linearGradient></defs>
      {grid.map((g, i) => { const yy = padT + g * (H - padB - padT); return (
        <g key={i}><line x1={padL} y1={yy} x2={W} y2={yy} stroke="#eef0f7" strokeWidth="1" />
          <text x={padL - 6} y={yy + 3} textAnchor="end" fontSize="9" fill="#9aa0b8">{Math.round(max * (1 - g))}</text></g>); })}
      <path d={area} fill="url(#areaG)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill="#fff" stroke={color} strokeWidth="1.6" />)}
      {labels.map((l, i) => (i % Math.ceil(labels.length / 7 || 1) === 0) &&
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#9aa0b8">{l}</text>)}
    </svg>
  );
}

export function Bars({ items = [] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (!items.length) return <div className="adm-empty">Pas encore de données.</div>;
  return (
    <div className="bars">
      {items.map((it, i) => (
        <div className="bar-row" key={i}>
          <span className="lbl" title={it.label}>{it.label}</span>
          <span className="bar-track"><span className="bar-fill" style={{ width: Math.max((it.value / max) * 100, 3) + '%', background: it.color ? `linear-gradient(90deg, ${it.color}, ${it.color}cc)` : undefined }} /></span>
          <span className="val">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ items = [], size = 168, thickness = 26 }) {
  const total = items.reduce((a, b) => a + b.value, 0);
  const r = (size - thickness) / 2, C = 2 * Math.PI * r, cx = size / 2;
  let offset = 0;
  const segs = items.map((it, i) => {
    const frac = total ? it.value / total : 0;
    const seg = { ...it, color: it.color || PALETTE[i % PALETTE.length], dash: frac * C, off: offset };
    offset += frac * C; return seg;
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef0f7" strokeWidth={thickness} />
        {total > 0 && segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={-s.off}
            transform={`rotate(-90 ${cx} ${cx})`} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cx - 2} textAnchor="middle" fontSize="26" fontWeight="800" fill="#15182b">{total}</text>
        <text x={cx} y={cx + 16} textAnchor="middle" fontSize="10" fill="#9aa0b8">total</text>
      </svg>
      <div className="legend" style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: 0 }}>
        {segs.map((s, i) => (<span key={i}><i style={{ background: s.color }} />{s.label} <b style={{ marginInlineStart: 4 }}>{s.value}</b></span>))}
      </div>
    </div>
  );
}

export { PALETTE };
