import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton } from '../components.jsx';
import api from '../api.js';

export default function PipelineDetail({ pipelineId, onNav }) {
  const gh = useGH();
  const [pipeline, setPipeline] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pipelineId || gh.projects.length === 0) return;
    const projectId = gh.projects[0]?.id;
    setLoading(true);
    Promise.all([
      api.get(`/projects/${projectId}/pipelines/${pipelineId}`).catch(() => null),
      api.get(`/projects/${projectId}/pipelines/${pipelineId}/jobs?per_page=50`).catch(() => []),
    ]).then(([pl, j]) => {
      setPipeline(pl);
      setJobs(Array.isArray(j) ? j : []);
      setLoading(false);
    });
  }, [pipelineId]);

  const statusBadge = s => <Badge kind={s === 'success' ? 'success' : s === 'failed' ? 'danger' : s === 'running' ? 'info' : 'neutral'}>{s}</Badge>;

  if (loading) return (
    <div className="page">
      <div className="page-header"><Skeleton h={24} w={200}/></div>
      <Skeleton h={120}/>
    </div>
  );

  if (!pipeline) return (
    <div className="page">
      <div className="page-header">
        <button className="btn" onClick={() => onNav('pipelines')}><I.arrowL size={13}/> Back</button>
      </div>
      <div className="text-sm muted">Pipeline not found.</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3">
            <button className="btn sm" onClick={() => onNav('pipelines')}><I.arrowL size={11}/></button>
            <h1 className="page-title" style={{ margin: 0 }}>Pipeline #{pipeline.id}</h1>
            {statusBadge(pipeline.status)}
          </div>
          <div className="page-subtitle mono">{pipeline.ref} · {(pipeline.sha || '').slice(0, 12)}</div>
        </div>
      </div>

      <div className="table-wrap mb-4" style={{ padding: 16 }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { l: 'Status', v: statusBadge(pipeline.status) },
            { l: 'Branch', v: <span className="mono">{pipeline.ref}</span> },
            { l: 'Created', v: pipeline.created_at ? new Date(pipeline.created_at).toLocaleString() : '—' },
            { l: 'Duration', v: pipeline.duration ? `${pipeline.duration}s` : '—' },
          ].map(({ l, v }) => (
            <div key={l} className="stat-card" style={{ padding: '10px 12px' }}>
              <span className="label">{l}</span>
              <span className="value" style={{ fontSize: 14 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar"><span className="mono text-xs muted">{jobs.length} jobs</span></div>
        <div className="table-scroll">
          <table className="gh">
            <thead><tr><th>Job</th><th>Stage</th><th>Status</th><th>Duration</th><th>Runner</th></tr></thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} className="clickable" onClick={() => onNav('job', j.id)}>
                  <td className="cell-mono">{j.name}</td>
                  <td className="cell-mono muted">{j.stage}</td>
                  <td>{statusBadge(j.status)}</td>
                  <td className="cell-mono muted">{j.duration ? `${Math.round(j.duration)}s` : '—'}</td>
                  <td className="cell-mono muted">{j.runner?.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
