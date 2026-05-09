import React from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge } from '../components.jsx';

export default function Settings({ tweaks, setTweak, onDisconnect }) {
  const gh = useGH();
  const u = gh.tokenUser || {};
  const inst = gh.instance || {};

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-subtitle">Session and display configuration</div>
        </div>
      </div>

      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Session info */}
        <div className="table-wrap" style={{ padding: 20 }}>
          <div className="mono text-xs muted mb-3">ACTIVE SESSION</div>
          <div className="grid" style={{ gridTemplateColumns: '120px 1fr', rowGap: 10, fontSize: 13 }}>
            <span className="muted mono text-xs">INSTANCE</span>
            <span className="mono">{inst.gitlabUrl || '—'}</span>
            <span className="muted mono text-xs">VERSION</span>
            <span className="mono">{inst.version || '—'}</span>
            <span className="muted mono text-xs">USER</span>
            <span className="mono">@{u.username || '—'}</span>
            <span className="muted mono text-xs">EMAIL</span>
            <span className="mono">{u.email || '—'}</span>
            <span className="muted mono text-xs">ADMIN</span>
            <span><Badge kind={u.is_admin ? 'danger' : 'neutral'}>{u.is_admin ? 'YES' : 'NO'}</Badge></span>
            <span className="muted mono text-xs">SCOPES</span>
            <div className="flex gap-1 flex-wrap">
              {(u.scopes || []).map(s => <Badge key={s} kind="success">{s}</Badge>)}
              {(!u.scopes || u.scopes.length === 0) && <span className="muted">—</span>}
            </div>
          </div>
        </div>

        {/* Display */}
        {tweaks && setTweak && (
          <div className="table-wrap" style={{ padding: 20 }}>
            <div className="mono text-xs muted mb-3">DISPLAY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex items-center" style={{ justifyContent: 'space-between' }}>
                <span className="text-sm">Density</span>
                <div className="flex gap-2">
                  {['compact', 'comfortable'].map(d => (
                    <button key={d} className={`filter-chip ${tweaks.density === d ? 'active' : ''}`} onClick={() => setTweak('density', d)}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center" style={{ justifyContent: 'space-between' }}>
                <span className="text-sm">Show risk layer</span>
                <button className={`filter-chip ${tweaks.showRiskLayer ? 'active' : ''}`} onClick={() => setTweak('showRiskLayer', !tweaks.showRiskLayer)}>
                  {tweaks.showRiskLayer ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data */}
        <div className="table-wrap" style={{ padding: 20 }}>
          <div className="mono text-xs muted mb-3">DATA</div>
          <div className="grid" style={{ gridTemplateColumns: '120px 1fr', rowGap: 8, fontSize: 13 }}>
            <span className="muted mono text-xs">PROJECTS</span><span className="mono">{gh.projects.length}</span>
            <span className="muted mono text-xs">GROUPS</span><span className="mono">{gh.groups.length}</span>
            <span className="muted mono text-xs">VARIABLES</span><span className="mono">{gh.variables.length}</span>
            <span className="muted mono text-xs">FINDINGS</span><span className="mono">{gh.findings.length}</span>
            <span className="muted mono text-xs">RUNNERS</span><span className="mono">{gh.runners.length}</span>
            <span className="muted mono text-xs">USERS</span><span className="mono">{gh.users.length}</span>
          </div>
          <div className="alert mt-3" style={{ fontSize: 12 }}>
            <span className="icon"><I.shield size={12}/></span>
            <div>No data is persisted. All data lives in memory and is cleared on disconnect.</div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="table-wrap" style={{ padding: 20, borderColor: 'var(--red-20)' }}>
          <div className="mono text-xs muted mb-3" style={{ color: 'var(--red)' }}>DANGER ZONE</div>
          <div className="text-sm muted mb-3">Disconnecting will destroy your session and clear all fetched data from memory.</div>
          <button className="btn" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={onDisconnect}>
            <I.plug size={13}/> Disconnect &amp; clear session
          </button>
        </div>
      </div>
    </div>
  );
}
