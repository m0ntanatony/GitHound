import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, StatCard, Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

export default function CICDOverview({ onNav }) {
  const gh = useGH();
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gh.projects.length === 0) return;
    setLoading(true);
    const topProjects = gh.projects.slice(0, 5);
    Promise.all(topProjects.map(p =>
      api.get(`/projects/${p.id}/pipelines?per_page=3`).catch(() => [])
    )).then(results => {
      const all = results.flat().map(pl => ({
        ...pl,
        projectName: topProjects.find(p => p.id === pl.project_id)?.name || '—'
      }));
      setPipelines(all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10));
      setLoading(false);
    });
  }, [gh.projects.length]);

  const statusColor = s => ({ success: 'var(--success)', failed: 'var(--red)', running: 'var(--info)', pending: 'var(--warning)', canceled: 'var(--text-3)' }[s] || 'var(--text-3)');

  const runners = gh.runners;
  const onlineRunners = runners.filter(r => r.online || r.status === 'online').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">CI/CD Overview</h1>
          <div className="page-subtitle">Pipeline and runner status across projects</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => onNav('pipelines')}><I.pipeline size={13}/> All pipelines</button>
        </div>
      </div>

      <div className="grid grid-4 mb-4">
        <StatCard label="Runners" value={runners.length}/>
        <StatCard label="Online" value={onlineRunners} danger={onlineRunners === 0 && runners.length > 0}/>
        <StatCard label="Projects w/ CI" value={gh.projects.filter(p => p.jobs_enabled).length}/>
        <StatCard label="Variables" value={gh.variables.length} danger={gh.findings.length > 0}/>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <span className="mono text-xs muted">Recent pipelines (top 5 projects)</span>
          <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => onNav('pipelines')}>
            All <I.arrowR size={11}/>
          </button>
        </div>
        {loading ? (
          <div>{[0,1,2,3].map(i => <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)' }}><Skeleton h={12} w="70%"/></div>)}</div>
        ) : pipelines.length === 0 ? (
          <Empty title="No pipelines" desc="No pipeline data available." icon={<I.pipeline size={20}/>}/>
        ) : (
          <div>
            {pipelines.map(pl => (
              <div key={pl.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}
                onClick={() => onNav('pipeline', pl.id)}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(pl.status), flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2">
                    <span className="mono text-xs muted">#{pl.id}</span>
                    <Badge kind={pl.status === 'success' ? 'success' : pl.status === 'failed' ? 'danger' : 'neutral'}>{pl.status}</Badge>
                    <span className="mono text-xs muted">{pl.ref}</span>
                  </div>
                  <div className="mono text-xs muted mt-1">{pl.projectName}</div>
                </div>
                <span className="mono text-xs muted">{pl.created_at ? new Date(pl.created_at).toLocaleDateString() : ''}</span>
                <I.chevR size={13} stroke="var(--text-4)"/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
