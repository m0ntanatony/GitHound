import React, { useState, useEffect } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton, Empty } from '../components.jsx';

export default function Users({ onNav }) {
  const gh = useGH();
  const [search, setSearch] = useState('');
  const loading = gh.loading.users;

  useEffect(() => {
    if (gh.users.length === 0 && !loading) gh.loadUsers();
  }, []);

  const rows = gh.users.filter(u =>
    !search || (u.username + ' ' + (u.name || '')).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <div className="page-subtitle">{gh.users.length} users visible to current token</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => gh.loadUsers()}><I.refresh size={13}/> Refresh</button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="search-input">
            <I.search size={11}/>
            <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{rows.length} of {gh.users.length}</span>
        </div>

        {loading && gh.users.length === 0 ? (
          <div>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Skeleton h={32} w={32} style={{ borderRadius: '50%', flexShrink: 0 }}/>
                <div style={{ flex: 1 }}><Skeleton h={12} w="40%" style={{ marginBottom: 6 }}/><Skeleton h={10} w="25%"/></div>
                <Skeleton h={18} w={60}/>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {rows.map(u => (
              <div key={u.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
                onClick={() => onNav('user', u.id)}>
                <span className="avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>
                  {(u.name || u.username || '?').slice(0, 2).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name || u.username}</div>
                  <div className="mono text-xs muted">@{u.username} · ID {u.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  {u.is_admin && <Badge kind="danger">ADMIN</Badge>}
                  {u.state && <Badge kind={u.state === 'active' ? 'success' : 'neutral'}>{u.state.toUpperCase()}</Badge>}
                  <I.chevR size={13} stroke="var(--text-4)"/>
                </div>
              </div>
            ))}
            {rows.length === 0 && !loading && (
              <Empty title="No users" desc="Try adjusting your search." icon={<I.users size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
