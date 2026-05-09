import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

export default function Commits() {
  const gh = useGH();
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState('');

  const targetProject = projectId || (gh.projects[0]?.id || '');

  useEffect(() => {
    if (!targetProject) return;
    setLoading(true);
    api.get(`/projects/${targetProject}/repository/commits?per_page=50`)
      .then(data => { setCommits(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setCommits([]); setLoading(false); });
  }, [targetProject]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Commits</h1>
          <div className="page-subtitle">Recent commits for selected project</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <select className="filter-chip" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {gh.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{commits.length} commits</span>
        </div>

        {loading ? (
          <div>{[0,1,2,3,4].map(i => (
            <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)' }}>
              <Skeleton h={13} w="70%" style={{ marginBottom: 6 }}/><Skeleton h={10} w="30%"/>
            </div>
          ))}</div>
        ) : (
          <div>
            {commits.map(c => (
              <div key={c.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <I.commit size={14} stroke="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.title || c.message?.split('\n')[0]}
                  </div>
                  <div className="mono text-xs muted">
                    {c.short_id || c.id?.slice(0, 8)} · {c.author_name}
                  </div>
                </div>
                <span className="mono text-xs muted" style={{ flexShrink: 0 }}>
                  {c.committed_date ? new Date(c.committed_date).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
            {commits.length === 0 && !loading && (
              <Empty title="No commits" desc="No commits found." icon={<I.commit size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
