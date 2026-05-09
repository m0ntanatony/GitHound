import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

export default function Repository() {
  const gh = useGH();
  const [projectId, setProjectId] = useState('');
  const [path, setPath] = useState('');
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  const targetProject = projectId || (gh.projects[0]?.id || '');

  useEffect(() => {
    if (!targetProject) return;
    loadTree(targetProject, '');
  }, [targetProject]);

  const loadTree = (pid, p) => {
    setLoading(true);
    const pathParam = p ? `&path=${encodeURIComponent(p)}` : '';
    api.get(`/projects/${pid}/repository/tree?per_page=100${pathParam}`)
      .then(data => {
        setTree(Array.isArray(data) ? data : []);
        setPath(p);
        setBreadcrumbs(p ? p.split('/') : []);
        setLoading(false);
      })
      .catch(() => { setTree([]); setLoading(false); });
  };

  const navigateTo = (item) => {
    if (item.type === 'tree') loadTree(targetProject, item.path);
  };

  const navigateBreadcrumb = (idx) => {
    const newPath = breadcrumbs.slice(0, idx + 1).join('/');
    loadTree(targetProject, newPath);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Repository</h1>
          <div className="page-subtitle">Browse repository file tree</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <select className="filter-chip" value={projectId} onChange={e => { setProjectId(e.target.value); setPath(''); setBreadcrumbs([]); }}>
            {gh.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 mono text-xs">
              <button className="btn sm" onClick={() => loadTree(targetProject, '')}>root</button>
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  <span className="muted">/</span>
                  <button className="btn sm" onClick={() => navigateBreadcrumb(i)}>{b}</button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div>{[0,1,2,3,4].map(i => (
            <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <Skeleton h={14} w={14} style={{ flexShrink: 0 }}/>
              <Skeleton h={12} w="40%"/>
            </div>
          ))}</div>
        ) : (
          <div>
            {path && (
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-1)', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
                onClick={() => {
                  const parts = path.split('/');
                  parts.pop();
                  loadTree(targetProject, parts.join('/'));
                }}>
                <I.folder size={14} stroke="var(--text-3)"/>
                <span className="mono text-sm muted">..</span>
              </div>
            )}
            {tree.map(item => (
              <div key={item.id} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-1)', cursor: item.type === 'tree' ? 'pointer' : 'default', display: 'flex', gap: 10, alignItems: 'center' }}
                onClick={() => navigateTo(item)}>
                {item.type === 'tree'
                  ? <I.folder size={14} stroke="var(--info)"/>
                  : <I.terminal size={14} stroke="var(--text-3)"/>
                }
                <span className="mono text-sm" style={{ flex: 1 }}>{item.name}</span>
                {item.type === 'blob' && <span className="mono text-xs muted">{item.mode}</span>}
                {item.type === 'tree' && <I.chevR size={12} stroke="var(--text-4)"/>}
              </div>
            ))}
            {tree.length === 0 && !loading && (
              <Empty title="Empty directory" desc="No files found." icon={<I.folder size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
