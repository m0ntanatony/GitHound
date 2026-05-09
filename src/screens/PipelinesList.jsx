import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

export default function PipelinesList({ onNav }) {
  const gh = useGH();
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState('');

  const targetProject = projectId || (gh.projects[0]?.id || '');

  useEffect(() => {
    if (!targetProject) return;
    setLoading(true);
    api.get(`/projects/${targetProject}/pipelines?per_page=30`)
      .then(data => { setPipelines(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setPipelines([]); setLoading(false); });
  }, [targetProject]);

  const statusBadge = s => <Badge kind={s === 'success' ? 'success' : s === 'failed' ? 'danger' : s === 'running' ? 'info' : 'neutral'}>{s}</Badge>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pipelines</h1>
          <div className="page-subtitle">Pipeline runs for selected project</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <select className="filter-chip" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {gh.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{pipelines.length} pipelines</span>
        </div>

        {loading ? (
          <div>{[0,1,2,3,4].map(i => <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)' }}><Skeleton h={12} w="70%"/></div>)}</div>
        ) : (
          <div className="table-scroll">
            <table className="gh">
              <thead>
                <tr><th>#</th><th>Status</th><th>Branch</th><th>SHA</th><th>Triggered</th><th>Created</th></tr>
              </thead>
              <tbody>
                {pipelines.map(pl => (
                  <tr key={pl.id} className="clickable" onClick={() => onNav('pipeline', pl.id)}>
                    <td className="cell-mono muted">#{pl.id}</td>
                    <td>{statusBadge(pl.status)}</td>
                    <td className="cell-mono">{pl.ref}</td>
                    <td className="cell-mono muted">{(pl.sha || '').slice(0, 8)}</td>
                    <td className="cell-mono muted">{pl.user?.username ? `@${pl.user.username}` : '—'}</td>
                    <td className="cell-mono muted">{pl.created_at ? new Date(pl.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pipelines.length === 0 && !loading && (
              <Empty title="No pipelines" desc="No pipeline data for this project." icon={<I.pipeline size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
