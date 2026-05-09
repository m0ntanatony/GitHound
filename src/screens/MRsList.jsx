import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

export default function MRsList() {
  const gh = useGH();
  const [mrs, setMrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [state, setState] = useState('opened');

  const targetProject = projectId || (gh.projects[0]?.id || '');

  useEffect(() => {
    if (!targetProject) return;
    setLoading(true);
    api.get(`/projects/${targetProject}/merge_requests?state=${state}&per_page=40`)
      .then(data => { setMrs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setMrs([]); setLoading(false); });
  }, [targetProject, state]);

  const stateBadge = s => <Badge kind={s === 'opened' ? 'info' : s === 'merged' ? 'success' : 'neutral'}>{s}</Badge>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Merge Requests</h1>
          <div className="page-subtitle">Merge requests for selected project</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <select className="filter-chip" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {gh.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="filter-chip" value={state} onChange={e => setState(e.target.value)}>
            <option value="opened">Open</option>
            <option value="merged">Merged</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{mrs.length} MRs</span>
        </div>

        {loading ? (
          <div>{[0,1,2,3].map(i => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)' }}>
              <Skeleton h={13} w="60%" style={{ marginBottom: 6 }}/><Skeleton h={11} w="40%"/>
            </div>
          ))}</div>
        ) : (
          <div>
            {mrs.map(mr => (
              <div key={mr.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <I.mr size={14} stroke="var(--info)" style={{ marginTop: 2, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-1">
                    {stateBadge(mr.state)}
                    <span className="mono text-xs muted">!{mr.iid}</span>
                    {mr.draft && <Badge kind="neutral">DRAFT</Badge>}
                  </div>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{mr.title}</div>
                  <div className="mono text-xs muted">
                    {mr.source_branch} → {mr.target_branch}
                    {mr.author && ` · @${mr.author.username}`}
                  </div>
                </div>
                <span className="mono text-xs muted">{mr.created_at ? new Date(mr.created_at).toLocaleDateString() : ''}</span>
              </div>
            ))}
            {mrs.length === 0 && !loading && (
              <Empty title="No merge requests" desc="No MRs found." icon={<I.mr size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
