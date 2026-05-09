import React from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, RoleChip } from '../components.jsx';

const SCOPE_DESCRIPTIONS = {
  api:              'Full read/write access to the API',
  read_api:         'Read-only access to the API',
  read_user:        'Read user info and profile',
  read_repository:  'Read repository data',
  write_repository: 'Write to repositories',
  read_registry:    'Read container registry',
  write_registry:   'Write to container registry',
  sudo:             'Perform API actions as any user (ADMIN)',
  admin_mode:       'Admin-level operations',
};

const SCOPE_RISK = {
  sudo: 'critical',
  admin_mode: 'critical',
  api: 'high',
  write_repository: 'high',
  write_registry: 'medium',
  read_api: 'low',
  read_user: 'low',
  read_repository: 'low',
  read_registry: 'low',
};

export default function Permissions() {
  const gh = useGH();
  const u = gh.tokenUser || {};
  const scopes = u.scopes || [];
  const inst = gh.instance || {};

  const highRiskScopes = scopes.filter(s => SCOPE_RISK[s] === 'critical' || SCOPE_RISK[s] === 'high');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Permissions</h1>
          <div className="page-subtitle">Token scopes and access rights</div>
        </div>
      </div>

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {highRiskScopes.length > 0 && (
          <div className="alert" style={{ borderLeftColor: 'var(--red)' }}>
            <span className="icon"><I.warning size={14}/></span>
            <div>
              <div className="title">High-privilege scopes detected</div>
              <div className="text-sm">This token has {highRiskScopes.length} sensitive scope{highRiskScopes.length > 1 ? 's' : ''}. Treat it as a high-risk credential.</div>
            </div>
          </div>
        )}

        <div className="table-wrap" style={{ padding: 20 }}>
          <div className="mono text-xs muted mb-3">TOKEN IDENTITY</div>
          <div className="flex items-center gap-3 mb-4">
            <span className="avatar lg">{(u.name || u.username || '?').slice(0,2).toUpperCase()}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name || u.username || '—'}</div>
              <div className="mono text-xs muted">@{u.username} · {inst.shortUrl}</div>
            </div>
            {u.is_admin && <Badge kind="danger" style={{ marginLeft: 'auto' }}>INSTANCE ADMIN</Badge>}
          </div>
          <div className="grid" style={{ gridTemplateColumns: '110px 1fr', rowGap: 8, fontSize: 13 }}>
            <span className="muted mono text-xs">EMAIL</span><span className="mono">{u.email || '—'}</span>
            <span className="muted mono text-xs">CREATED</span><span className="mono">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
            <span className="muted mono text-xs">2FA</span><span>{u.two_factor_enabled ? <Badge kind="success">ENABLED</Badge> : <Badge kind="danger">DISABLED</Badge>}</span>
          </div>
        </div>

        <div className="table-wrap" style={{ padding: 20 }}>
          <div className="mono text-xs muted mb-3">OAUTH SCOPES</div>
          {scopes.length === 0 ? (
            <div className="text-sm muted">No scopes reported (may require admin token to read)</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scopes.map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-1)' }}>
                  <Badge kind={SCOPE_RISK[s] === 'critical' ? 'danger' : SCOPE_RISK[s] === 'high' ? 'warning' : 'success'} style={{ flexShrink: 0, marginTop: 1 }}>
                    {s}
                  </Badge>
                  <span className="text-sm muted">{SCOPE_DESCRIPTIONS[s] || s}</span>
                  {(SCOPE_RISK[s] === 'critical' || SCOPE_RISK[s] === 'high') && (
                    <I.warning size={13} stroke="var(--red)" style={{ marginLeft: 'auto', flexShrink: 0 }}/>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="table-wrap" style={{ padding: 20 }}>
          <div className="mono text-xs muted mb-3">ACCESS SUMMARY</div>
          <div className="grid" style={{ gridTemplateColumns: '110px 1fr', rowGap: 8, fontSize: 13 }}>
            <span className="muted mono text-xs">PROJECTS</span><span className="mono">{gh.projects.length} accessible</span>
            <span className="muted mono text-xs">GROUPS</span><span className="mono">{gh.groups.length} accessible</span>
            <span className="muted mono text-xs">VARIABLES</span><span className="mono">{gh.variables.length} readable</span>
            <span className="muted mono text-xs">RUNNERS</span><span className="mono">{gh.runners.length} visible</span>
          </div>
        </div>
      </div>
    </div>
  );
}
