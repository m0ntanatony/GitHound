import React, { useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, SeverityBadge, SeverityBar, RiskBadge, StatCard, Drawer, Skeleton, Empty } from '../components.jsx';

export default function Security({ embedded, onNav }) {
  const gh = useGH();
  const [sev, setSev] = useState('all');
  const [cat, setCat] = useState('all');
  const [selected, setSelected] = useState(null);

  const rows = gh.findings.filter(f =>
    (sev === 'all' || f.severity === sev) && (cat === 'all' || f.category === cat)
  );
  const cats = [...new Set(gh.findings.map(f => f.category))];
  const loading = gh.loading.variables;

  const inner = (
    <>
      {!embedded && (
        <div className="grid grid-5 mb-4">
          {[['critical','Critical','danger'],['high','High','danger'],['medium','Medium','warning'],['low','Low','info'],['info','Info','neutral']].map(([s,l,k]) => (
            <div key={s} className={`stat-card ${s === 'critical' || s === 'high' ? 'danger' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setSev(sev === s ? 'all' : s)}>
              <span className="label">{l}</span>
              <span className="value">{gh.findings.filter(f => f.severity === s).length}</span>
            </div>
          ))}
        </div>
      )}
      {loading && gh.findings.length === 0 ? (
        <div className="table-wrap">
          {[0,1,2,3].map(i => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-1)' }}>
              <Skeleton h={12} w="40%" style={{ marginBottom: 8 }}/>
              <Skeleton h={10} w="70%"/>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-toolbar">
            <select className="filter-chip" value={sev} onChange={e => setSev(e.target.value)}>
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
            <select className="filter-chip" value={cat} onChange={e => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{rows.length} findings</span>
          </div>
          <div>
            {rows.map(f => (
              <div key={f.id} style={{ padding: 14, borderBottom: '1px solid var(--border-1)', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }} onClick={() => setSelected(f)}>
                <SeverityBar level={f.severity}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge level={f.severity}/>
                    <span className="mono text-xs muted">{f.id}</span>
                    <span className="mono text-xs muted">·</span>
                    <span className="mono text-xs muted">{f.category}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{f.title}</div>
                  <div className="mono text-xs muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.asset}</div>
                </div>
                <I.chevR size={14} stroke="var(--text-4)"/>
              </div>
            ))}
            {rows.length === 0 && (
              <Empty title="No findings" desc={gh.variables.length === 0 ? "Load variables to analyze them." : "No findings match current filters."} icon={<I.shield size={20}/>}/>
            )}
          </div>
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.id || ''}
        footer={<button className="btn primary" onClick={() => { onNav && onNav('variables'); setSelected(null); }}><I.arrowR size={11}/> Go to variables</button>}>
        {selected && (
          <div className="flex-col gap-3">
            <div className="flex items-center gap-2"><SeverityBadge level={selected.severity}/><Badge kind="neutral">{selected.category}</Badge></div>
            <h2 style={{ fontSize: 17, margin: 0 }}>{selected.title}</h2>
            <div className="mono text-sm muted">{selected.asset}</div>
            <div>
              <div className="mono text-xs muted mb-1">EVIDENCE</div>
              <div style={{ padding: 10, background: 'var(--bg-1)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)' }}>{selected.evidence}</div>
            </div>
            <div>
              <div className="mono text-xs muted mb-1">DESCRIPTION</div>
              <div className="text-sm">{selected.description}</div>
            </div>
            <div>
              <div className="mono text-xs muted mb-1">RECOMMENDATION</div>
              <div className="text-sm" style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 4, borderLeft: '2px solid var(--success)' }}>{selected.recommendation}</div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );

  if (embedded) return inner;
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Security <RiskBadge level="critical"/></h1>
          <div className="page-subtitle">{gh.findings.length} findings detected · based on {gh.variables.length} variables</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => gh.loadVariables(gh.projects)}><I.refresh size={13}/> Re-scan</button>
        </div>
      </div>
      {inner}
    </div>
  );
}
