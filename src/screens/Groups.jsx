import React, { useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton, Empty } from '../components.jsx';

export default function Groups({ onNav }) {
  const gh = useGH();
  const [search, setSearch] = useState('');
  const loading = gh.loading.groups;

  const rows = gh.groups.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Groups</h1>
          <div className="page-subtitle">{gh.groups.length} groups accessible with current token</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => gh.loadGroups()}><I.refresh size={13}/> Refresh</button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="search-input">
            <I.search size={11}/>
            <input placeholder="Search groups…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{rows.length} of {gh.groups.length}</span>
        </div>

        {loading && gh.groups.length === 0 ? (
          <div>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <Skeleton h={36} w={36} style={{ borderRadius: 6, flexShrink: 0 }}/>
                <div style={{ flex: 1 }}><Skeleton h={13} w="40%" style={{ marginBottom: 6 }}/><Skeleton h={11} w="25%"/></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {rows.map(g => (
              <div key={g.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}
                onClick={() => onNav('group', g.id)}>
                <span className="avatar" style={{ width: 36, height: 36, fontSize: 14, flexShrink: 0, borderRadius: 6 }}>
                  {(g.name || '?').slice(0, 2).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{g.name}</div>
                  <div className="mono text-xs muted">{g.full_path || g.path}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="mono text-xs muted">{g.projects || 0} projects</span>
                  {g.visibility && <Badge kind="neutral">{g.visibility.toUpperCase()}</Badge>}
                  <I.chevR size={13} stroke="var(--text-4)"/>
                </div>
              </div>
            ))}
            {rows.length === 0 && !loading && (
              <Empty title="No groups" desc="No groups found." icon={<I.group size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
