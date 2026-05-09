import React, { useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, RiskBadge, VisibilityIcon, Skeleton, Empty } from '../components.jsx';

export default function Projects({ onNav }) {
  const gh = useGH();
  const [search, setSearch] = useState('');
  const [vis, setVis] = useState('all');
  const [sortBy, setSortBy] = useState('risk');
  const loading = gh.loading.projects;

  let rows = gh.projects.filter(p => {
    if (search && !(p.name + ' ' + p.namespace).toLowerCase().includes(search.toLowerCase())) return false;
    if (vis !== 'all' && p.visibility !== vis) return false;
    return true;
  });

  if (sortBy === 'risk') {
    const order = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
    rows = [...rows].sort((a, b) => (order[a.risk] ?? 5) - (order[b.risk] ?? 5));
  } else if (sortBy === 'name') {
    rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'stars') {
    rows = [...rows].sort((a, b) => (b.star_count || 0) - (a.star_count || 0));
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <div className="page-subtitle">{gh.projects.length} projects accessible with current token</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => gh.loadProjects()}><I.refresh size={13}/> Refresh</button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="search-input">
            <I.search size={11}/>
            <input placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select className="filter-chip" value={vis} onChange={e => setVis(e.target.value)}>
            <option value="all">All visibility</option>
            <option value="public">Public</option>
            <option value="internal">Internal</option>
            <option value="private">Private</option>
          </select>
          <select className="filter-chip" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="risk">Sort: Risk</option>
            <option value="name">Sort: Name</option>
            <option value="stars">Sort: Stars</option>
          </select>
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{rows.length} of {gh.projects.length}</span>
        </div>

        {loading && gh.projects.length === 0 ? (
          <div>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <Skeleton h={36} w={36} style={{ borderRadius: '50%', flexShrink: 0 }}/>
                <div style={{ flex: 1 }}><Skeleton h={13} w="50%" style={{ marginBottom: 6 }}/><Skeleton h={11} w="30%"/></div>
                <Skeleton h={20} w={60}/>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {rows.map(p => (
              <div key={p.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}
                onClick={() => onNav('project', p.id)}>
                <span className="avatar" style={{ width: 36, height: 36, fontSize: 14, flexShrink: 0 }}>
                  {(p.name || '?').slice(0, 2).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                    <VisibilityIcon v={p.visibility}/>
                    {p.archived && <Badge kind="neutral">ARCHIVED</Badge>}
                  </div>
                  <div className="mono text-xs muted">{p.namespace}/{p.path}</div>
                </div>
                <div className="flex items-center gap-3">
                  {p.star_count > 0 && <span className="mono text-xs muted">★ {p.star_count}</span>}
                  <RiskBadge level={p.risk}/>
                  <I.chevR size={13} stroke="var(--text-4)"/>
                </div>
              </div>
            ))}
            {rows.length === 0 && !loading && (
              <Empty title="No projects" desc="Try adjusting filters." icon={<I.folder size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
