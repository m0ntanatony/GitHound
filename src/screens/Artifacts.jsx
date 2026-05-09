import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

export default function Artifacts() {
  const gh = useGH();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState('');

  const targetProject = projectId || (gh.projects[0]?.id || '');
  const project = gh.projects.find(p => String(p.id) === String(targetProject)) || gh.projects[0];

  useEffect(() => {
    if (!targetProject) return;
    setLoading(true);
    api.get(`/projects/${targetProject}/jobs?per_page=50&scope[]=success`)
      .then(data => {
        const withArtifacts = (Array.isArray(data) ? data : []).filter(j =>
          j.artifacts && j.artifacts.length > 0
        );
        setJobs(withArtifacts);
        setLoading(false);
      })
      .catch(() => { setJobs([]); setLoading(false); });
  }, [targetProject]);

  const artifactDownloadUrl = (jobId, artifactType = 'archive') =>
    `/api/gitlab/projects/${targetProject}/jobs/${jobId}/artifacts`;

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const ARTIFACT_RISK = {
    archive: 'Build artifacts may contain compiled binaries with embedded credentials',
    reports: 'Test reports may expose API keys or environment details',
    coverage_report: 'Coverage reports sometimes include source snippets',
    junit: 'JUnit reports may contain test fixture data',
    dotenv: 'dotenv artifacts expose environment variables to downstream jobs',
    sast: 'SAST reports contain vulnerability details',
    secret_detection: 'Secret detection reports contain found secrets',
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Artifacts</h1>
          <div className="page-subtitle">Pipeline job artifacts — may contain compiled secrets, env files, or credentials</div>
        </div>
      </div>

      <div className="alert mb-4" style={{ borderLeftColor: 'var(--red)' }}>
        <span className="icon"><I.warning size={14}/></span>
        <div>
          <div className="title">Artifacts are accessible via API with the current token</div>
          <div className="text-sm">
            Build artifacts frequently contain <span className="mono text-red">.env</span> files, configuration files, compiled binaries, and other artifacts that may embed credentials from CI/CD variables.
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <select className="filter-chip" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {gh.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{jobs.length} jobs with artifacts</span>
        </div>

        {loading ? (
          <div>{[0,1,2,3].map(i => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)' }}>
              <Skeleton h={13} w="50%" style={{ marginBottom: 6 }}/><Skeleton h={10} w="30%"/>
            </div>
          ))}</div>
        ) : jobs.length === 0 ? (
          <Empty title="No artifacts" desc="No successful jobs with artifacts found." icon={<I.archive size={20}/>}/>
        ) : (
          <div>
            {jobs.map(j => {
              const artifacts = j.artifacts || [];
              return (
                <div key={j.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-1)' }}>
                  <div className="flex items-start gap-3">
                    <I.archive size={14} stroke="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="mono text-sm" style={{ fontWeight: 500 }}>{j.name}</span>
                        <span className="mono text-xs muted">#{j.id}</span>
                        <Badge kind="neutral">{j.ref}</Badge>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                        {artifacts.map((a, i) => {
                          const risk = ARTIFACT_RISK[a.file_type];
                          return (
                            <div key={i} style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 4, border: '1px solid var(--border-1)', display: 'flex', gap: 10, alignItems: 'center' }}>
                              <Badge kind={a.file_type === 'dotenv' || a.file_type === 'secret_detection' ? 'danger' : 'neutral'}>
                                {a.file_type || 'archive'}
                              </Badge>
                              <span className="mono text-xs muted">{formatSize(a.size)}</span>
                              {risk && <span className="text-xs muted" style={{ flex: 1 }}>{risk}</span>}
                              <a
                                href={artifactDownloadUrl(j.id)}
                                download
                                className="btn sm"
                                style={{ textDecoration: 'none', flexShrink: 0 }}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <I.download size={11}/> Download
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <span className="mono text-xs muted" style={{ flexShrink: 0 }}>
                      {j.finished_at ? new Date(j.finished_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
