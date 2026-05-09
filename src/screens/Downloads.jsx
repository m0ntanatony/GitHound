import React, { useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Empty } from '../components.jsx';

export default function Downloads() {
  const gh = useGH();
  const [projectId, setProjectId] = useState('');

  const targetProject = projectId
    ? gh.projects.find(p => String(p.id) === String(projectId))
    : gh.projects[0];

  const formats = ['tar.gz', 'tar.bz2', 'tbz', 'tbz2', 'tb2', 'bz2', 'tar', 'zip'];

  const downloadUrl = (fmt) => {
    if (!targetProject) return '#';
    return `/api/gitlab/projects/${targetProject.id}/repository/archive.${fmt}`;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Downloads</h1>
          <div className="page-subtitle">Download repository archives</div>
        </div>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="table-wrap mb-4" style={{ padding: 20 }}>
          <div className="mono text-xs muted mb-3">SELECT PROJECT</div>
          <select className="filter-chip" style={{ width: '100%' }} value={projectId} onChange={e => setProjectId(e.target.value)}>
            {gh.projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.namespace})</option>)}
          </select>
        </div>

        {gh.projects.length === 0 ? (
          <Empty title="No projects" desc="Load projects first." icon={<I.download size={20}/>}/>
        ) : (
          <div className="table-wrap" style={{ padding: 20 }}>
            <div className="mono text-xs muted mb-3">ARCHIVE FORMATS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {formats.map(fmt => (
                <div key={fmt} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-1)' }}>
                  <I.download size={14} stroke="var(--text-3)"/>
                  <span className="mono text-sm" style={{ flex: 1 }}>{targetProject?.name || '…'}.{fmt}</span>
                  <Badge kind="neutral">{fmt.toUpperCase()}</Badge>
                  <a
                    href={downloadUrl(fmt)}
                    download
                    className="btn sm"
                    style={{ textDecoration: 'none' }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <I.download size={11}/> Download
                  </a>
                </div>
              ))}
            </div>
            <div className="alert mt-4" style={{ fontSize: 12 }}>
              <span className="icon"><I.warning size={12}/></span>
              <div>Downloads are proxied through the GitHound server using your session token.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
