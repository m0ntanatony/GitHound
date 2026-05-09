import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

export default function Branches() {
  const gh = useGH();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [search, setSearch] = useState('');

  const targetProject = projectId || (gh.projects[0]?.id || '');

  useEffect(() => {
    if (!targetProject) return;
    setLoading(true);
    api.get(`/projects/${targetProject}/repository/branches?per_page=100`)
      .then(data => { setBranches(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setBranches([]); setLoading(false); });
  }, [targetProject]);

  const rows = branches.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Branches</h1>
          <div className="page-subtitle">{branches.length} branches in selected project</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <select className="filter-chip" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {gh.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="search-input">
            <I.search size={11}/>
            <input placeholder="Filter branches…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{rows.length} of {branches.length}</span>
        </div>

        {loading ? (
          <div>{[0,1,2,3,4].map(i => (
            <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-1)' }}>
              <Skeleton h={12} w="40%"/>
            </div>
          ))}</div>
        ) : (
          <div className="table-scroll">
            <table className="gh">
              <thead><tr><th>Branch</th><th>Last commit</th><th>Author</th><th>Date</th><th>Protected</th></tr></thead>
              <tbody>
                {rows.map(b => (
                  <tr key={b.name}>
                    <td>
                      <div className="flex items-center gap-2">
                        <I.branch size={12} stroke="var(--text-3)"/>
                        <span className="mono text-sm" style={{ fontWeight: b.default ? 600 : 400 }}>{b.name}</span>
                        {b.default && <Badge kind="info">DEFAULT</Badge>}
                      </div>
                    </td>
                    <td className="cell-mono muted">{(b.commit?.short_id || b.commit?.id || '').slice(0, 8)}</td>
                    <td className="cell-mono muted">{b.commit?.author_name || '—'}</td>
                    <td className="cell-mono muted">{b.commit?.committed_date ? new Date(b.commit.committed_date).toLocaleDateString() : '—'}</td>
                    <td>{b.protected ? <Badge kind="success">YES</Badge> : <Badge kind="neutral">no</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && !loading && (
              <Empty title="No branches" desc="No branches found." icon={<I.branch size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
