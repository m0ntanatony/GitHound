import React, { useState } from 'react';

export function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 200,
          width: 34, height: 34,
          background: 'var(--surface-2)', border: '1px solid var(--border-2)',
          borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-2)', fontSize: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
        title="Tweaks"
      >
        ⚙
      </button>
      {open && (
        <div style={{
          position: 'fixed', bottom: 60, right: 16, zIndex: 200,
          width: 260,
          background: 'var(--surface-2)', border: '1px solid var(--border-2)',
          borderRadius: 8,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-1)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>{title}</span>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 0, color: 'var(--text-3)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
            {children}
          </div>
        </div>
      )}
    </>
  );
}

export function TweakSection({ title, children }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)', paddingTop: 6 }}>{title}</div>
      {children}
    </>
  );
}

export function TweakRadio({ label, value, options, onChange }) {
  const opts = options.map(o => typeof o === 'object' ? o : { value: o, label: o });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {opts.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            flex: 1, padding: '4px 6px', fontSize: 11, fontFamily: 'var(--font-mono)',
            background: value === o.value ? 'var(--red-12)' : 'var(--surface-3)',
            border: `1px solid ${value === o.value ? 'var(--red-18)' : 'var(--border-1)'}`,
            color: value === o.value ? 'var(--red)' : 'var(--text-2)',
            borderRadius: 4, cursor: 'pointer',
          }}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

export function TweakToggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{
        position: 'relative', width: 32, height: 18, border: 0, borderRadius: 999,
        background: value ? 'var(--red)' : 'var(--surface-4)', cursor: 'pointer', padding: 0,
        transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 14 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'left 0.15s',
        }}/>
      </button>
    </div>
  );
}

export function TweakSelect({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: 'var(--surface-3)', border: '1px solid var(--border-1)',
        color: 'var(--text-1)', borderRadius: 4, padding: '4px 8px', fontSize: 12,
        fontFamily: 'var(--font-mono)', outline: 'none',
      }}>
        {options.map(o => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </div>
  );
}

export function TweakColorSwatches({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)} title={o.label} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: o.color, border: `2px solid ${value === o.value ? '#fff' : 'transparent'}`,
            cursor: 'pointer', outline: value === o.value ? `2px solid ${o.color}` : 'none',
            outlineOffset: 2,
          }}/>
        ))}
      </div>
    </div>
  );
}
