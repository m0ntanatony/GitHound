import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

export default function DeployKeys() {
  const gh = useGH();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState('');

  const targetProject = projectId || (gh.projects[0]?.id || '');

  useEffect(() => {
    if (!targetProject) return;
    setLoading(true);
    api.get(`/projects/${targetProject}/deploy_keys?per_page=100`)
      .then(data => { setKeys(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setKeys([]); setLoading(false); });
  }, [targetProject]);

  const writeableKeys = keys.filter(k => k.can_push);
  const expiredKeys   = keys.filter(k => k.expires_at && new Date(k.expires_at) < new Date());

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Deploy Keys</h1>
          <div className="page-subtitle">SSH deploy keys grant read (or write) access to repositories</div>
        </div>
      </div>

      {(writeableKeys.length > 0 || expiredKeys.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {writeableKeys.length > 0 && (
            <div className="alert" style={{ borderLeftColor: 'var(--red)' }}>
              <span className="icon"><I.warning size={14}/></span>
              <div>
                <div className="title">{writeableKeys.length} deploy key{writeableKeys.length > 1 ? 's' : ''} with write access</div>
                <div className="text-sm">Write-enabled deploy keys can push code — a compromise gives full repo write access.</div>
              </div>
            </div>
          )}
          {expiredKeys.length > 0 && (
            <div className="alert">
              <span className="icon"><I.warning size={13}/></span>
              <div>
                <div className="title">{expiredKeys.length} expired key{expiredKeys.length > 1 ? 's' : ''} still present</div>
                <div className="text-sm">Expired keys should be removed — they may still be usable depending on GitLab version.</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="table-wrap">
        <div className="table-toolbar">
          <select className="filter-chip" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {gh.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{keys.length} keys</span>
        </div>

        {loading ? (
          <div>{[0,1,2].map(i => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)' }}>
              <Skeleton h={13} w="50%" style={{ marginBottom: 6 }}/><Skeleton h={10} w="70%"/>
            </div>
          ))}</div>
        ) : (
          <div className="table-scroll">
            <table className="gh">
              <thead>
                <tr><th>Title</th><th>Fingerprint</th><th>Access</th><th>Created</th><th>Expires</th><th>Last Used</th></tr>
              </thead>
              <tbody>
                {keys.map(k => {
                  const expired = k.expires_at && new Date(k.expires_at) < new Date();
                  return (
                    <tr key={k.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <I.key size={13} stroke={k.can_push ? 'var(--red)' : 'var(--text-3)'}/>
                          <span style={{ fontWeight: 500 }}>{k.title}</span>
                        </div>
                      </td>
                      <td>
                        <div className="mono text-xs muted" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {k.fingerprint_sha256 || k.fingerprint || '—'}
                        </div>
                      </td>
                      <td>
                        {k.can_push
                          ? <Badge kind="danger">READ / WRITE</Badge>
                          : <Badge kind="neutral">READ ONLY</Badge>}
                      </td>
                      <td className="cell-mono muted">{k.created_at ? new Date(k.created_at).toLocaleDateString() : '—'}</td>
                      <td className="cell-mono" style={{ color: expired ? 'var(--red)' : '' }}>
                        {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : <span className="muted">never</span>}
                        {expired && <Badge kind="warning" style={{ marginLeft: 4 }}>EXPIRED</Badge>}
                      </td>
                      <td className="cell-mono muted">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {keys.length === 0 && !loading && (
              <Empty title="No deploy keys" desc="No deploy keys on this project." icon={<I.key size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
