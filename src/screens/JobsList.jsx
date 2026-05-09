import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

export default function JobsList({ onNav }) {
  const gh = useGH();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('all');

  const targetProject = projectId || (gh.projects[0]?.id || '');

  useEffect(() => {
    if (!targetProject) return;
    setLoading(true);
    const statusParam = status !== 'all' ? `&scope=${status}` : '';
    api.get(`/projects/${targetProject}/jobs?per_page=40${statusParam}`)
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setJobs([]); setLoading(false); });
  }, [targetProject, status]);

  const statusBadge = s => <Badge kind={s === 'success' ? 'success' : s === 'failed' ? 'danger' : s === 'running' ? 'info' : 'neutral'}>{s}</Badge>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jobs</h1>
          <div className="page-subtitle">CI job runs for selected project</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <select className="filter-chip" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {gh.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="filter-chip" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
            <option value="canceled">Canceled</option>
          </select>
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{jobs.length} jobs</span>
        </div>

        {loading ? (
          <div>{[0,1,2,3,4].map(i => <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)' }}><Skeleton h={12} w="60%"/></div>)}</div>
        ) : (
          <div className="table-scroll">
            <table className="gh">
              <thead>
                <tr><th>#</th><th>Name</th><th>Stage</th><th>Status</th><th>Branch</th><th>Duration</th><th>Created</th></tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} className="clickable" onClick={() => onNav('job', j.id)}>
                    <td className="cell-mono muted">#{j.id}</td>
                    <td className="cell-mono">{j.name}</td>
                    <td className="cell-mono muted">{j.stage}</td>
                    <td>{statusBadge(j.status)}</td>
                    <td className="cell-mono muted">{j.ref}</td>
                    <td className="cell-mono muted">{j.duration ? `${Math.round(j.duration)}s` : '—'}</td>
                    <td className="cell-mono muted">{j.created_at ? new Date(j.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && !loading && (
              <Empty title="No jobs" desc="No job data for this project." icon={<I.job size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
