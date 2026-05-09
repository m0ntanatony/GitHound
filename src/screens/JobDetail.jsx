import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton } from '../components.jsx';
import api from '../api.js';

export default function JobDetail({ jobId, onNav }) {
  const gh = useGH();
  const [job, setJob] = useState(null);
  const [trace, setTrace] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId || gh.projects.length === 0) return;
    const projectId = gh.projects[0]?.id;
    setLoading(true);
    Promise.all([
      api.get(`/projects/${projectId}/jobs/${jobId}`).catch(() => null),
      fetch(`/api/gitlab/projects/${projectId}/jobs/${jobId}/trace`, {
        headers: { Accept: 'text/plain' }
      }).then(r => r.text()).catch(() => ''),
    ]).then(([j, t]) => {
      setJob(j);
      setTrace(t || '');
      setLoading(false);
    });
  }, [jobId]);

  const statusBadge = s => <Badge kind={s === 'success' ? 'success' : s === 'failed' ? 'danger' : s === 'running' ? 'info' : 'neutral'}>{s}</Badge>;

  if (loading) return (
    <div className="page">
      <div className="page-header"><Skeleton h={24} w={200}/></div>
      <Skeleton h={200}/>
    </div>
  );

  if (!job) return (
    <div className="page">
      <div className="page-header">
        <button className="btn" onClick={() => onNav('jobs')}><I.arrowL size={13}/> Back</button>
      </div>
      <div className="text-sm muted">Job not found.</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3">
            <button className="btn sm" onClick={() => onNav('jobs')}><I.arrowL size={11}/></button>
            <h1 className="page-title" style={{ margin: 0 }}>{job.name}</h1>
            {statusBadge(job.status)}
          </div>
          <div className="page-subtitle mono">{job.ref} · stage: {job.stage}</div>
        </div>
      </div>

      <div className="grid grid-4 mb-4">
        {[
          { l: 'Status', v: statusBadge(job.status) },
          { l: 'Stage', v: <span className="mono">{job.stage}</span> },
          { l: 'Duration', v: job.duration ? `${Math.round(job.duration)}s` : '—' },
          { l: 'Runner', v: <span className="mono">{job.runner?.description || '—'}</span> },
        ].map(({ l, v }) => (
          <div key={l} className="stat-card" style={{ padding: '10px 12px' }}>
            <span className="label">{l}</span>
            <span className="value" style={{ fontSize: 14 }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <div className="table-toolbar"><span className="mono text-xs muted">JOB LOG</span></div>
        <div style={{ padding: 12, background: 'var(--bg-0)', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6, maxHeight: 500, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--text-2)' }}>
          {trace || <span className="muted">No log output available.</span>}
        </div>
      </div>
    </div>
  );
}
