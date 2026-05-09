import React, { useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, RiskBadge, StatCard, Modal, Drawer, HiddenValue, Skeleton, Empty, matchRiskKeyword } from '../components.jsx';

export default function Variables({ embedded, projectFilter }) {
  const gh = useGH();
  const [search, setSearch]         = useState('');
  const [showRisky, setShowRisky]   = useState(false);
  const [showUnmasked, setShowUnmasked] = useState(false);
  const [showUnprotected, setShowUnprotected] = useState(false);
  const [showProd, setShowProd]     = useState(false);
  const [source, setSource]         = useState('all');
  const [revealed, setRevealed]     = useState({});
  const [confirming, setConfirming] = useState(null);
  const [drawer, setDrawer]         = useState(null);

  const loading = gh.loading.variables;

  let rows = gh.variables.filter(v => {
    if (projectFilter && v.sourcePath !== projectFilter) return false;
    if (search && !v.key.toLowerCase().includes(search.toLowerCase())) return false;
    if (showRisky && v.risk !== 'critical' && v.risk !== 'high') return false;
    if (showUnmasked && v.masked) return false;
    if (showUnprotected && v.protected) return false;
    if (showProd && v.envScope !== 'production') return false;
    if (source !== 'all' && v.source !== source) return false;
    return true;
  });

  const reveal = (id) => { setRevealed(r => ({ ...r, [id]: true })); setConfirming(null); };

  const stats = {
    total:       gh.variables.length,
    risky:       gh.variables.filter(v => v.risk === 'critical' || v.risk === 'high').length,
    unmasked:    gh.variables.filter(v => !v.masked).length,
    unprotected: gh.variables.filter(v => !v.protected).length,
  };

  const inner = (
    <>
      {!embedded && (
        <div className="grid grid-4 mb-4">
          <StatCard label="Total variables" value={loading ? '…' : stats.total}/>
          <StatCard label="Risky"       value={loading ? '…' : stats.risky}       danger icon={<I.warning size={14}/>}/>
          <StatCard label="Unmasked"    value={loading ? '…' : stats.unmasked}    danger icon={<I.eye size={14}/>}/>
          <StatCard label="Unprotected" value={loading ? '…' : stats.unprotected} danger icon={<I.unlock size={14}/>}/>
        </div>
      )}

      <div className="alert mb-3">
        <span className="icon"><I.shield size={14}/></span>
        <div>
          <div className="title">Variable values are hidden by default</div>
          <div className="text-sm">Click <span className="mono text-red">Reveal</span> to display a value. You will be asked to confirm before any sensitive value is shown.</div>
        </div>
      </div>

      {loading && gh.variables.length === 0 ? (
        <div className="table-wrap">
          <div className="table-toolbar"><Skeleton w={200} h={22}/></div>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-1)' }}>
              <Skeleton h={12} w="60%"/>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-toolbar">
            <div className="search-input">
              <I.search size={11}/>
              <input placeholder="Search variable keys…" value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <button className={`filter-chip ${showRisky ? 'active' : ''}`} onClick={() => setShowRisky(v => !v)}>
              <I.warning size={11}/> Risky
            </button>
            <button className={`filter-chip ${showUnmasked ? 'active' : ''}`} onClick={() => setShowUnmasked(v => !v)}>
              <I.eye size={11}/> Unmasked
            </button>
            <button className={`filter-chip ${showUnprotected ? 'active' : ''}`} onClick={() => setShowUnprotected(v => !v)}>
              <I.unlock size={11}/> Unprotected
            </button>
            <button className={`filter-chip ${showProd ? 'active' : ''}`} onClick={() => setShowProd(v => !v)}>
              PROD
            </button>
            <select className="filter-chip" value={source} onChange={e => setSource(e.target.value)}>
              <option value="all">All sources</option>
              <option value="project">Project</option>
              <option value="group">Group</option>
            </select>
            <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">
              {rows.length} of {gh.variables.length}
              {loading && ' (loading…)'}
            </span>
          </div>
          <div className="table-scroll">
            <table className="gh">
              <thead>
                <tr>
                  <th>Key</th><th>Value</th><th>Type</th><th>Env</th>
                  <th>Protected</th><th>Masked</th><th>Source</th><th>Risk</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(v => {
                  const isRevealed = revealed[v.id];
                  const kw = matchRiskKeyword(v.key);
                  return (
                    <tr key={v.id} className="clickable" onClick={() => setDrawer(v)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <I.key size={12} stroke={kw ? 'var(--red)' : 'var(--text-3)'}/>
                          <span className="mono text-sm" style={{ fontWeight: 500 }}>{v.key}</span>
                        </div>
                        {v.tags.length > 0 && (
                          <div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
                            {v.tags.slice(0, 4).map(t => (
                              <Badge key={t} kind={t === 'UNMASKED' || t === 'UNPROTECTED' ? 'danger' : 'neutral'}>{t}</Badge>
                            ))}
                          </div>
                        )}
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ maxWidth: 280 }}>
                        {isRevealed ? (
                          <div className="mono text-xs" style={{ wordBreak: 'break-all', color: 'var(--red)', background: 'var(--red-08)', padding: '2px 6px', borderRadius: 3 }}>
                            {v.value.slice(0, 60)}{v.value.length > 60 ? '…' : ''}
                          </div>
                        ) : <HiddenValue/>}
                      </td>
                      <td><Badge kind="neutral">{v.type === 'file' ? 'FILE' : 'ENV'}</Badge></td>
                      <td className="cell-mono">
                        {v.envScope === '*' ? <span className="muted">all</span> : <span className={v.envScope === 'production' ? 'text-red' : ''}>{v.envScope}</span>}
                      </td>
                      <td>{v.protected ? <Badge kind="success" dot>PROTECTED</Badge> : <Badge kind="danger" dot>UNPROTECTED</Badge>}</td>
                      <td>{v.masked ? <Badge kind="success">MASKED</Badge> : <Badge kind="danger">UNMASKED</Badge>}</td>
                      <td>
                        <Badge kind={v.source === 'group' ? 'purple' : 'info'}>{v.source.toUpperCase()}</Badge>
                        <div className="mono text-xs muted mt-1">{v.sourcePath}</div>
                      </td>
                      <td><RiskBadge level={v.risk}/></td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className={`eye-toggle ${isRevealed ? 'shown' : ''}`}
                          onClick={() => isRevealed ? setRevealed(r => ({...r, [v.id]: false})) : setConfirming(v)}>
                          {isRevealed ? <><I.eyeOff size={11}/> Hide</> : <><I.eye size={11}/> Reveal</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && !loading && (
              <Empty title="No variables match" desc="Try adjusting filters or search." icon={<I.key size={20}/>}/>
            )}
          </div>
        </div>
      )}

      {/* Confirm reveal modal */}
      <Modal open={!!confirming} onClose={() => setConfirming(null)} danger title="Reveal sensitive value"
        footer={
          <>
            <button className="btn" onClick={() => setConfirming(null)}>Cancel</button>
            <button className="btn primary" onClick={() => reveal(confirming.id)}>
              <I.eye size={12}/> Reveal value
            </button>
          </>
        }>
        <div className="reveal-warning">
          <I.warning size={16}/>
          <div>
            <div style={{ color: 'var(--text-1)', fontWeight: 600, marginBottom: 4 }}>You are about to reveal sensitive data.</div>
            <div className="text-sm">This value may contain tokens, passwords, private keys or production secrets.</div>
          </div>
        </div>
        {confirming && (
          <div className="grid" style={{ gridTemplateColumns: '110px 1fr', rowGap: 8, fontSize: 13 }}>
            <span className="muted mono text-xs">KEY</span><span className="mono">{confirming.key}</span>
            <span className="muted mono text-xs">SOURCE</span><span className="mono">{confirming.sourcePath}</span>
            <span className="muted mono text-xs">SCOPE</span><span className="mono">{confirming.envScope}</span>
            <span className="muted mono text-xs">RISK</span><span><RiskBadge level={confirming.risk}/></span>
          </div>
        )}
      </Modal>

      {/* Variable detail drawer */}
      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title={drawer ? drawer.key : ''}
        footer={drawer && (
          <>
            <button className="btn" onClick={() => navigator.clipboard?.writeText(drawer.key)}>
              <I.copy size={11}/> Copy key
            </button>
            <button className="btn primary" onClick={() => { setConfirming(drawer); setDrawer(null); }}>
              <I.eye size={11}/> Reveal
            </button>
          </>
        )}>
        {drawer && (
          <div className="flex-col gap-3">
            <div className="grid" style={{ gridTemplateColumns: '120px 1fr', rowGap: 8, fontSize: 13 }}>
              <span className="muted mono text-xs">SOURCE</span>
              <span><Badge kind={drawer.source === 'group' ? 'purple' : 'info'}>{drawer.source}</Badge>{' '}<span className="mono text-xs muted">{drawer.sourcePath}</span></span>
              <span className="muted mono text-xs">TYPE</span><span className="mono">{drawer.type}</span>
              <span className="muted mono text-xs">ENV SCOPE</span><span className="mono">{drawer.envScope}</span>
              <span className="muted mono text-xs">PROTECTED</span><span>{drawer.protected ? <Badge kind="success">YES</Badge> : <Badge kind="danger">NO</Badge>}</span>
              <span className="muted mono text-xs">MASKED</span><span>{drawer.masked ? <Badge kind="success">YES</Badge> : <Badge kind="danger">NO</Badge>}</span>
              <span className="muted mono text-xs">RAW</span><span>{drawer.raw ? <Badge kind="warning">YES</Badge> : <Badge kind="neutral">NO</Badge>}</span>
              <span className="muted mono text-xs">RISK</span><span><RiskBadge level={drawer.risk}/></span>
            </div>
            {drawer.tags.length > 0 && (
              <div>
                <div className="mono text-xs muted mb-2">DETECTED PATTERNS</div>
                <div className="flex gap-1 flex-wrap">
                  {drawer.tags.map(t => <Badge key={t} kind={t === 'UNMASKED' || t === 'UNPROTECTED' ? 'danger' : 'warning'}>{t}</Badge>)}
                </div>
              </div>
            )}
            <div>
              <div className="mono text-xs muted mb-2">VALUE</div>
              <div style={{ padding: 12, background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                {revealed[drawer.id] ? <span className="text-red" style={{ wordBreak: 'break-all' }}>{drawer.value}</span> : <HiddenValue length={32}/>}
              </div>
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
          <h1 className="page-title">Variables <RiskBadge level="critical"/></h1>
          <div className="page-subtitle">CI/CD variables visible to current token across {gh.projects.length} projects</div>
        </div>
      </div>
      {inner}
    </div>
  );
}
