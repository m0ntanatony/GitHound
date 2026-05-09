import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, RiskBadge, StatCard, Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

export default function GroupDetail({ groupId, onNav }) {
  const gh = useGH();
  const [detail, setDetail] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const group = gh.groups.find(g => String(g.id) === String(groupId));

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    Promise.all([
      api.get(`/groups/${groupId}`).catch(() => null),
      api.get(`/groups/${groupId}/members?per_page=20`).catch(() => []),
    ]).then(([d, m]) => {
      setDetail(d);
      setMembers(Array.isArray(m) ? m : []);
      setLoading(false);
    });
  }, [groupId]);

  const g = detail || group;

  if (loading && !g) return (
    <div className="page">
      <div className="page-header"><Skeleton h={24} w={200}/></div>
      <Skeleton h={160}/>
    </div>
  );

  if (!g) return (
    <div className="page">
      <button className="btn" onClick={() => onNav('groups')}><I.arrowL size={13}/> Back</button>
      <div className="text-sm muted mt-4">Group not found.</div>
    </div>
  );

  const groupProjects = gh.projects.filter(p =>
    p.namespace && (p.namespace === g.name || p.namespace === g.full_path || p.namespace === g.path)
  );

  const ROLE_LABELS = { 10: 'Guest', 20: 'Reporter', 30: 'Developer', 40: 'Maintainer', 50: 'Owner' };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3">
            <button className="btn sm" onClick={() => onNav('groups')}><I.arrowL size={11}/></button>
            <h1 className="page-title" style={{ margin: 0 }}>{g.name}</h1>
            {g.visibility && <Badge kind="neutral">{g.visibility.toUpperCase()}</Badge>}
          </div>
          <div className="page-subtitle mono">{g.full_path || g.path}</div>
        </div>
        {g.web_url && (
          <div className="page-actions">
            <a href={g.web_url} target="_blank" rel="noopener" className="btn"><I.ext size={13}/> Open in GitLab</a>
          </div>
        )}
      </div>

      <div className="grid grid-3 mb-4">
        <StatCard label="Projects" value={groupProjects.length || g.projects || 0}/>
        <StatCard label="Members" value={members.length}/>
        <StatCard label="Subgroups" value={g.subgroup_count || 0}/>
      </div>

      {g.description && (
        <div className="table-wrap mb-4" style={{ padding: 16 }}>
          <div className="mono text-xs muted mb-2">DESCRIPTION</div>
          <div className="text-sm">{g.description}</div>
        </div>
      )}

      {members.length > 0 && (
        <div className="table-wrap mb-4">
          <div className="table-toolbar"><span className="mono text-xs muted">MEMBERS ({members.length})</span></div>
          <div className="table-scroll">
            <table className="gh">
              <thead><tr><th>User</th><th>Role</th><th>Expires</th></tr></thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="avatar sm">{(m.name || m.username || '?').slice(0,2).toUpperCase()}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                          <div className="mono text-xs muted">@{m.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge kind={m.access_level >= 50 ? 'danger' : m.access_level >= 40 ? 'warning' : 'neutral'}>
                        {ROLE_LABELS[m.access_level] || m.access_level}
                      </Badge>
                    </td>
                    <td className="cell-mono muted">{m.expires_at || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {groupProjects.length > 0 && (
        <div className="table-wrap">
          <div className="table-toolbar"><span className="mono text-xs muted">PROJECTS IN GROUP</span></div>
          <div>
            {groupProjects.map(p => (
              <div key={p.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
                onClick={() => onNav('project', p.id)}>
                <I.folder size={14} stroke="var(--text-3)"/>
                <span style={{ flex: 1, fontSize: 14 }}>{p.name}</span>
                <RiskBadge level={p.risk}/>
                <I.chevR size={13} stroke="var(--text-4)"/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
