import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, RiskBadge, VisibilityIcon, StatCard, Skeleton } from '../components.jsx';
import Variables from './Variables.jsx';
import api from '../api.js';

export default function ProjectDetail({ projectId, onNav }) {
  const gh = useGH();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const project = gh.projects.find(p => String(p.id) === String(projectId));

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    api.get(`/projects/${projectId}`)
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  const p = detail || project;

  if (loading && !p) return (
    <div className="page">
      <div className="page-header"><Skeleton h={24} w={200}/></div>
      <Skeleton h={160}/>
    </div>
  );

  if (!p) return (
    <div className="page">
      <button className="btn" onClick={() => onNav('projects')}><I.arrowL size={13}/> Back</button>
      <div className="text-sm muted mt-4">Project not found.</div>
    </div>
  );

  const projVars = gh.variables.filter(v => v.sourcePath === p.path_with_namespace || v.sourcePath === p.namespace + '/' + p.path);
  const projFindings = gh.findings.filter(f => f.asset && (f.asset.includes(p.path_with_namespace) || f.asset.includes(p.name)));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3">
            <button className="btn sm" onClick={() => onNav('projects')}><I.arrowL size={11}/></button>
            <h1 className="page-title" style={{ margin: 0 }}>{p.name}</h1>
            <VisibilityIcon v={p.visibility}/>
            <RiskBadge level={p.risk}/>
          </div>
          <div className="page-subtitle mono">{p.path_with_namespace || `${p.namespace}/${p.path}`}</div>
        </div>
        {p.web_url && (
          <div className="page-actions">
            <a href={p.web_url} target="_blank" rel="noopener" className="btn">
              <I.ext size={13}/> Open in GitLab
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-4 mb-4">
        <StatCard label="Variables" value={projVars.length} danger={projVars.some(v => v.risk === 'critical' || v.risk === 'high')}/>
        <StatCard label="Findings" value={projFindings.length} danger={projFindings.length > 0}/>
        <StatCard label="Stars" value={p.star_count || 0}/>
        <StatCard label="Forks" value={p.forks_count || 0}/>
      </div>

      {p.description && (
        <div className="table-wrap mb-4" style={{ padding: 16 }}>
          <div className="mono text-xs muted mb-2">DESCRIPTION</div>
          <div className="text-sm">{p.description}</div>
        </div>
      )}

      <div className="table-wrap mb-4" style={{ padding: 16 }}>
        <div className="mono text-xs muted mb-3">DETAILS</div>
        <div className="grid" style={{ gridTemplateColumns: '130px 1fr', rowGap: 8, fontSize: 13 }}>
          <span className="muted mono text-xs">VISIBILITY</span><span><Badge kind="neutral">{p.visibility}</Badge></span>
          <span className="muted mono text-xs">DEFAULT BRANCH</span><span className="mono">{p.default_branch || '—'}</span>
          <span className="muted mono text-xs">CREATED</span><span className="mono">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</span>
          <span className="muted mono text-xs">LAST ACTIVITY</span><span className="mono">{p.last_activity_at ? new Date(p.last_activity_at).toLocaleDateString() : '—'}</span>
          <span className="muted mono text-xs">CI/CD</span><span>{p.jobs_enabled ? <Badge kind="success">ENABLED</Badge> : <Badge kind="neutral">DISABLED</Badge>}</span>
          <span className="muted mono text-xs">ARCHIVED</span><span>{p.archived ? <Badge kind="warning">YES</Badge> : <Badge kind="neutral">no</Badge>}</span>
        </div>
      </div>

      {projVars.length > 0 && (
        <div className="mb-4">
          <div className="mono text-xs muted mb-2">PROJECT VARIABLES</div>
          <Variables embedded projectFilter={p.path_with_namespace || `${p.namespace}/${p.path}`}/>
        </div>
      )}
    </div>
  );
}
