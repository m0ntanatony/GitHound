import React from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Card, StatCard, Badge, SeverityBadge, RiskBadge, StatusDot, Skeleton } from '../components.jsx';
import { scanValueForSecrets } from '../context.jsx';

export default function Overview({ onNav }) {
  const gh = useGH();
  const u = gh.tokenUser || {};
  const inst = gh.instance || {};
  const findings = gh.findings;
  const loading = gh.loading;

  const sevCount = (s) => findings.filter(f => f.severity === s).length;

  const stats = {
    groups:   gh.groups.length,
    projects: gh.projects.length,
    vars:     gh.variables.length,
    riskyVars: gh.variables.filter(v => v.risk === 'critical' || v.risk === 'high').length,
    unmasked:  gh.variables.filter(v => !v.masked).length,
    unprotected: gh.variables.filter(v => !v.protected).length,
    users:    gh.users.length,
    runners:  gh.runners.length,
  };

  const scopes = (u.scopes || []);

  // Attack surface derived from token capabilities
  const canWrite = scopes.some(s => s === 'api' || s === 'write_repository');
  const writableProjects = canWrite ? gh.projects.length : 0;
  const secretsExposed = gh.variables.filter(v => scanValueForSecrets(v.value).length > 0).length;
  const onlineRunners = gh.runners.filter(r => r.status === 'online').length;
  const adminUsers = gh.users.filter(u2 => u2.admin).length;
  const no2fa = gh.users.filter(u2 => u2.two_factor_enabled === false).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <div className="page-subtitle mono">
            Connected to {inst.shortUrl || '…'} · @{u.username || '…'}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => {
            gh.loadProjects().then(() => gh.loadVariables(gh.projects));
            gh.loadGroups(); gh.loadActivity();
          }}>
            <I.refresh size={13}/> Sync
          </button>
          <button className="btn primary" onClick={() => onNav('security')}>
            <I.shield size={13}/> View security
          </button>
        </div>
      </div>

      <div className="grid grid-3 mb-4">
        {/* Token Identity */}
        <Card title="Token Identity">
          <div className="flex items-center gap-3 mb-3">
            <span className="avatar lg">{(u.name || u.username || '?').slice(0,2).toUpperCase()}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{u.name || u.username || '—'}</div>
              <div className="mono text-xs muted">@{u.username || '—'} · ID {u.id}</div>
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '90px 1fr', rowGap: 8, fontSize: 12 }}>
            <span className="muted mono text-xs">EMAIL</span>
            <span className="mono">{u.email || '—'}</span>
            <span className="muted mono text-xs">ADMIN</span>
            <span><Badge kind={u.is_admin ? 'danger' : 'neutral'}>{u.is_admin ? 'YES' : 'no'}</Badge></span>
            <span className="muted mono text-xs">GITLAB</span>
            <span className="mono">{inst.version || '—'}</span>
          </div>
          {scopes.length > 0 && (
            <div className="mt-3" style={{ borderTop: '1px solid var(--border-1)', paddingTop: 10 }}>
              <div className="mono text-xs muted mb-2">TOKEN SCOPES</div>
              <div className="flex gap-1 flex-wrap">
                {scopes.map(s => (
                  <span key={s} className="badge success">{s}</span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Access Summary */}
        <Card title="Access Summary">
          {loading.projects || loading.groups ? (
            <div className="grid grid-3" style={{ gap: 8 }}>
              {[0,1,2,3,4,5].map(i => <Skeleton key={i} h={70}/>)}
            </div>
          ) : (
            <div className="grid grid-3" style={{ gap: 8 }}>
              {[
                { l: 'Groups',    v: stats.groups   },
                { l: 'Projects',  v: stats.projects  },
                { l: 'Variables', v: stats.vars, danger: stats.riskyVars > 0 },
                { l: 'Risky vars',v: stats.riskyVars, danger: true },
                { l: 'Unmasked',  v: stats.unmasked, danger: stats.unmasked > 0 },
                { l: 'Runners',   v: stats.runners   },
              ].map(s => (
                <div key={s.l} className="stat-card" style={{ padding: '10px 12px' }}>
                  <span className="label">{s.l}</span>
                  <span className="value" style={{ fontSize: 20, color: s.danger && s.v > 0 ? 'var(--red)' : 'inherit' }}>{s.v}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Risk Summary */}
        <Card title="Risk Summary" action={
          <button className="btn sm" onClick={() => onNav('security')}>
            View all <I.arrowR size={11}/>
          </button>
        }>
          {loading.variables ? (
            <Skeleton h={120}/>
          ) : findings.length === 0 ? (
            <div className="text-sm muted" style={{ padding: '20px 0', textAlign: 'center' }}>
              {gh.variables.length === 0 ? 'Loading variables…' : 'No findings detected'}
            </div>
          ) : (
            <>
              <div className="mono text-xs muted mb-2">SEVERITY DISTRIBUTION</div>
              <div className="flex items-end gap-1" style={{ height: 50, marginBottom: 8 }}>
                {[
                  { s: 'critical', c: sevCount('critical'), color: 'var(--red)'     },
                  { s: 'high',     c: sevCount('high'),     color: 'var(--red-hover)'},
                  { s: 'medium',   c: sevCount('medium'),   color: 'var(--warning)'  },
                  { s: 'low',      c: sevCount('low'),      color: 'var(--info)'     },
                  { s: 'info',     c: sevCount('info'),     color: 'var(--text-3)'   },
                ].map(b => (
                  <div key={b.s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ height: `${Math.max(4, b.c * 10)}px`, width: '100%', background: b.color, borderRadius: '2px 2px 0 0', minHeight: 4 }}/>
                    <span className="mono" style={{ fontSize: 10, color: b.color }}>{b.c}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mono text-xs muted">
                <span>CRIT</span><span>HIGH</span><span>MED</span><span>LOW</span><span>INFO</span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Token Attack Surface */}
      <Card title="Token Attack Surface" style={{ marginBottom: 12 }} action={
        <button className="btn sm" onClick={() => onNav('security')}>
          Full audit <I.arrowR size={11}/>
        </button>
      }>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { l: 'Instance admin',    v: u.is_admin ? 'YES' : 'no',       danger: u.is_admin },
            { l: 'Token write access',v: canWrite ? 'YES' : 'read-only',  danger: canWrite },
            { l: 'Secrets in values', v: secretsExposed,                  danger: secretsExposed > 0 },
            { l: 'Online runners',    v: onlineRunners,                   danger: onlineRunners > 0 },
            { l: 'Admin accounts',    v: adminUsers,                      danger: adminUsers > 1 },
            { l: 'No-2FA users',      v: gh.users.length > 0 ? no2fa : '—', danger: no2fa > 0 },
          ].map(s => (
            <div key={s.l} className="stat-card" style={{ padding: '8px 10px' }}>
              <span className="label">{s.l}</span>
              <span className="value" style={{ fontSize: 16, color: s.danger ? 'var(--red)' : 'inherit' }}>{String(s.v)}</span>
            </div>
          ))}
        </div>
        {u.is_admin && (
          <div style={{ padding: '8px 10px', background: 'var(--red-08)', borderRadius: 4, border: '1px solid var(--red-20)', fontSize: 12, color: 'var(--red)' }}>
            <strong>Admin token</strong> — can impersonate any user, read all projects, modify any variable, and issue new tokens.
          </div>
        )}
        {!u.is_admin && secretsExposed > 0 && (
          <div style={{ padding: '8px 10px', background: 'var(--red-08)', borderRadius: 4, border: '1px solid var(--red-20)', fontSize: 12, color: 'var(--red)' }}>
            <strong>{secretsExposed} variable{secretsExposed > 1 ? 's' : ''}</strong> contain recognisable secret patterns in their values — directly readable via this token.
          </div>
        )}
      </Card>

      {/* Top Findings */}
      {findings.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
          <Card title="Top Findings" action={
            <button className="btn sm" onClick={() => onNav('security')}>
              All {findings.length} <I.arrowR size={11}/>
            </button>
          }>
            <div className="flex-col" style={{ gap: 8 }}>
              {findings.slice(0, 4).map(f => (
                <div key={f.id} style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border-1)', cursor: 'pointer' }}
                  onClick={() => onNav('security')}>
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge level={f.severity}/>
                    <span className="mono text-xs muted">{f.id}</span>
                    <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{f.category}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{f.title}</div>
                  <div className="mono text-xs muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.asset}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recent Activity" action={
            <button className="btn sm" onClick={() => onNav('activity')}>All <I.arrowR size={11}/></button>
          }>
            {loading.activity ? (
              <div className="flex-col" style={{ gap: 6 }}>
                {[0,1,2,3].map(i => <Skeleton key={i} h={28}/>)}
              </div>
            ) : gh.activity.length === 0 ? (
              <div className="text-sm muted" style={{ textAlign: 'center', padding: 20 }}>No recent activity</div>
            ) : (
              <div className="flex-col" style={{ gap: 4 }}>
                {gh.activity.slice(0, 7).map((a, i) => (
                  <div key={i} className="flex items-center gap-2" style={{ padding: '6px 4px', borderBottom: i < 6 ? '1px solid var(--border-1)' : 'none' }}>
                    <span className="avatar sm">{a.avatar}</span>
                    <div style={{ flex: 1, fontSize: 12, minWidth: 0, overflow: 'hidden' }}>
                      <span className="mono">@{a.actor}</span>{' '}
                      <span className="muted">{a.text}</span>{' '}
                      <span className="mono text-xs" style={{ color: a.status === 'failed' ? 'var(--red)' : 'var(--text-1)' }}>
                        {a.target.slice(0, 30)}{a.target.length > 30 ? '…' : ''}
                      </span>
                    </div>
                    <span className="mono text-xs muted" style={{ flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
