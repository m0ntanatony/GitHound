import React from 'react';
import { I } from './icons.jsx';

// ── Logo ───────────────────────────────────────────────────────────────────
export const Logo = ({ size = 22 }) => (
  <span className="logo">
    <span className="mark" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
        <defs>
          <linearGradient id="lg-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF2D2D"/>
            <stop offset="1" stopColor="#8B0000"/>
          </linearGradient>
        </defs>
        <path d="M12 2l9 5v10l-9 5-9-5V7z" fill="url(#lg-grad)" stroke="#FF4D4D" strokeWidth="0.8"/>
        <circle cx="12" cy="12" r="3" fill="#05070A" stroke="#FF4D4D" strokeWidth="1"/>
        <circle cx="12" cy="12" r="0.9" fill="#FF4D4D"/>
        <path d="M12 5v3M12 16v3M5.5 8.5l2.6 1.5M15.9 14l2.6 1.5M5.5 15.5l2.6-1.5M15.9 10l2.6-1.5" stroke="#FF4D4D" strokeWidth="1.1"/>
      </svg>
    </span>
    <span>git<span className="accent">hound</span></span>
  </span>
);

// ── Badge ─────────────────────────────────────────────────────────────────
export const Badge = ({ kind = 'neutral', children, dot }) => (
  <span className={`badge ${kind}`}>{dot && <span className="dot"/>}{children}</span>
);

// ── RoleChip ──────────────────────────────────────────────────────────────
export const RoleChip = ({ role }) => {
  const r = (role || '').toLowerCase();
  return <span className={`role-chip role-${r}`}>{role}</span>;
};

// ── VisibilityIcon ────────────────────────────────────────────────────────
export const VisibilityIcon = ({ v }) => {
  if (v === 'private') return <span className="tip" data-tip="Private"><I.privateIcon size={12}/></span>;
  if (v === 'internal') return <span className="tip" data-tip="Internal"><I.internal size={12}/></span>;
  return <span className="tip" data-tip="Public"><I.globe size={12}/></span>;
};

// ── StatusDot ─────────────────────────────────────────────────────────────
export const StatusDot = ({ status }) => {
  const map = {
    success:  { c: 'var(--success)', l: 'success' },
    failed:   { c: 'var(--red)',     l: 'failed'  },
    running:  { c: 'var(--info)',    l: 'running' },
    canceled: { c: 'var(--text-3)', l: 'canceled' },
    skipped:  { c: 'var(--text-4)', l: 'skipped'  },
    manual:   { c: 'var(--orange)', l: 'manual'   },
    online:   { c: 'var(--success)','l': 'online'  },
    offline:  { c: 'var(--text-3)', l: 'offline'  },
    pending:  { c: 'var(--warning)','l': 'pending' },
  };
  const m = map[status] || { c: 'var(--text-3)', l: status || '—' };
  const animate = status === 'running' || status === 'pending';
  return (
    <span className="flex items-center gap-2">
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: m.c,
        boxShadow: `0 0 6px ${m.c}`,
        animation: animate ? 'pulse 1.4s ease-in-out infinite' : 'none',
        display: 'inline-block', flexShrink: 0,
      }}/>
      <span className="mono text-xs" style={{ color: m.c }}>{m.l}</span>
    </span>
  );
};

// ── SeverityBar ───────────────────────────────────────────────────────────
export const SeverityBar = ({ level }) => {
  const order = ['info','low','medium','high','critical'];
  const idx = order.indexOf(level);
  return (
    <span className="severity-bar tip" data-tip={level}>
      {[0,1,2,3,4].map(i => <span key={i} className={`seg ${i <= idx ? 'on' : ''} ${level}`}/>)}
    </span>
  );
};

// ── SeverityBadge ─────────────────────────────────────────────────────────
export const SeverityBadge = ({ level }) => {
  const map = {
    critical: { kind: 'danger',  label: 'CRITICAL' },
    high:     { kind: 'danger',  label: 'HIGH'     },
    medium:   { kind: 'warning', label: 'MEDIUM'   },
    low:      { kind: 'info',    label: 'LOW'       },
    info:     { kind: 'neutral', label: 'INFO'      },
  };
  const m = map[level] || { kind: 'neutral', label: (level||'').toUpperCase() };
  return <Badge kind={m.kind} dot>{m.label}</Badge>;
};

// ── RiskBadge ─────────────────────────────────────────────────────────────
export const RiskBadge = ({ level }) => {
  if (!level || level === 'none') return null;
  const map = {
    critical: { kind: 'danger',  label: 'CRITICAL'  },
    high:     { kind: 'danger',  label: 'HIGH RISK' },
    medium:   { kind: 'warning', label: 'MEDIUM'    },
    low:      { kind: 'info',    label: 'LOW'        },
  };
  const m = map[level] || { kind: 'neutral', label: level };
  return <Badge kind={m.kind}>{m.label}</Badge>;
};

// ── Card ──────────────────────────────────────────────────────────────────
export const Card = ({ title, action, children, padded = true, className = '' }) => (
  <div className={`card ${className}`} style={padded ? {} : { padding: 0 }}>
    {(title || action) && (
      <div className="card-header" style={padded ? {} : { padding: '12px 16px', borderBottom: '1px solid var(--border-1)', marginBottom: 0 }}>
        {title && <h3 className="card-title">{title}</h3>}
        {action}
      </div>
    )}
    {padded ? children : <div style={{ padding: 16 }}>{children}</div>}
  </div>
);

// ── StatCard ──────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, delta, danger, icon }) => (
  <div className={`stat-card ${danger ? 'danger' : ''}`}>
    {icon && <span className="icon">{icon}</span>}
    <span className="label">{label}</span>
    <span className="value">{value ?? '—'}</span>
    {delta && <span className={`delta ${delta.dir}`}>{delta.text}</span>}
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer, danger }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {danger && <I.warning size={16} stroke="var(--red)"/>}
            {title}
          </h2>
          <button className="icon-btn" onClick={onClose}><I.x size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ── Drawer ────────────────────────────────────────────────────────────────
export const Drawer = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose}/>
      <div className="drawer">
        <div className="drawer-header">
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h2>
          <button className="icon-btn" onClick={onClose}><I.x size={14}/></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </>
  );
};

// ── Empty ─────────────────────────────────────────────────────────────────
export const Empty = ({ icon, title, desc }) => (
  <div className="empty">
    <div className="empty-icon">{icon || <I.folder size={20}/>}</div>
    <div className="empty-title">{title}</div>
    <div className="empty-desc">{desc}</div>
  </div>
);

// ── Skeleton ──────────────────────────────────────────────────────────────
export const Skeleton = ({ w = '100%', h = 12, style = {} }) => (
  <div className="skel" style={{ width: w, height: h, ...style }}/>
);

export const SkelTable = ({ rows = 6, cols = 5 }) => (
  <div className="table-wrap">
    <div className="table-toolbar">
      <Skeleton w={200} h={20}/>
      <div style={{ marginLeft: 'auto' }}/>
      <Skeleton w={80} h={20}/>
    </div>
    <table className="gh">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            {Array.from({ length: cols }).map((_, j) => (
              <td key={j}><Skeleton w={`${40 + Math.random() * 50}%`} h={10}/></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Tabs ──────────────────────────────────────────────────────────────────
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="tabs">
    {tabs.map(t => (
      <button key={t.key} className={`tab ${active === t.key ? 'active' : ''}`} onClick={() => onChange(t.key)}>
        {t.icon}{t.label}
        {t.count != null && <span className="count">{t.count}</span>}
      </button>
    ))}
  </div>
);

// ── Breadcrumbs ───────────────────────────────────────────────────────────
export const Breadcrumbs = ({ items }) => (
  <div className="breadcrumbs">
    {items.map((it, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="sep">/</span>}
        {it.onClick ? <button onClick={it.onClick}>{it.label}</button> : <span>{it.label}</span>}
      </React.Fragment>
    ))}
  </div>
);

// ── HiddenValue ───────────────────────────────────────────────────────────
export const HiddenValue = ({ length = 16 }) => (
  <span className="mono" style={{ color: 'var(--text-3)', letterSpacing: '0.1em' }}>
    {'•'.repeat(Math.min(length, 20))}
  </span>
);

// ── VAR_RISK_KEYWORDS / matchRiskKeyword ──────────────────────────────────
export const VAR_RISK_KEYWORDS = ['SECRET','TOKEN','PASSWORD','PASS','PRIVATE_KEY','AWS','GCP','AZURE','DOCKER','REGISTRY','PROD','DATABASE','SSH','API_KEY','STRIPE'];
export const matchRiskKeyword = (key) => VAR_RISK_KEYWORDS.find(k => key.toUpperCase().includes(k));

// ── Global pulse animation ────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes blink { 50%{opacity:0} }
.cursor-blink::after{content:'▊';animation:blink 1s step-end infinite;color:var(--red);margin-left:2px}
`;
  document.head.appendChild(styleEl);
}
