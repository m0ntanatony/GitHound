import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, RoleChip, StatCard, Skeleton } from '../components.jsx';
import api from '../api.js';

export default function UserDetail({ userId, onNav }) {
  const gh = useGH();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const cachedUser = gh.users.find(u => String(u.id) === String(userId));

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get(`/users/${userId}`)
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const u = detail || cachedUser;

  if (loading && !u) return (
    <div className="page">
      <div className="page-header"><Skeleton h={24} w={200}/></div>
      <Skeleton h={160}/>
    </div>
  );

  if (!u) return (
    <div className="page">
      <button className="btn" onClick={() => onNav('users')}><I.arrowL size={13}/> Back</button>
      <div className="text-sm muted mt-4">User not found.</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3">
            <button className="btn sm" onClick={() => onNav('users')}><I.arrowL size={11}/></button>
            <span className="avatar lg">{(u.name || u.username || '?').slice(0,2).toUpperCase()}</span>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>{u.name || u.username}</h1>
              <div className="mono text-xs muted">@{u.username} · ID {u.id}</div>
            </div>
            {u.is_admin && <Badge kind="danger">ADMIN</Badge>}
          </div>
        </div>
        {u.web_url && (
          <div className="page-actions">
            <a href={u.web_url} target="_blank" rel="noopener" className="btn"><I.ext size={13}/> Profile</a>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-wrap" style={{ padding: 20 }}>
          <div className="mono text-xs muted mb-3">IDENTITY</div>
          <div className="grid" style={{ gridTemplateColumns: '130px 1fr', rowGap: 8, fontSize: 13 }}>
            <span className="muted mono text-xs">EMAIL</span><span className="mono">{u.email || u.public_email || '—'}</span>
            <span className="muted mono text-xs">STATE</span>
            <span><Badge kind={u.state === 'active' ? 'success' : 'neutral'}>{u.state || '—'}</Badge></span>
            <span className="muted mono text-xs">2FA</span>
            <span>{u.two_factor_enabled ? <Badge kind="success">ENABLED</Badge> : <Badge kind="danger">DISABLED</Badge>}</span>
            <span className="muted mono text-xs">CREATED</span><span className="mono">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
            <span className="muted mono text-xs">LAST SIGN IN</span><span className="mono">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '—'}</span>
            <span className="muted mono text-xs">CAN CREATE</span>
            <div className="flex gap-1">
              {u.can_create_group && <Badge kind="info">GROUPS</Badge>}
              {u.can_create_project && <Badge kind="info">PROJECTS</Badge>}
            </div>
          </div>
        </div>

        {u.bio && (
          <div className="table-wrap" style={{ padding: 20 }}>
            <div className="mono text-xs muted mb-2">BIO</div>
            <div className="text-sm">{u.bio}</div>
          </div>
        )}

        {u.is_admin && (
          <div className="alert" style={{ borderLeftColor: 'var(--red)' }}>
            <span className="icon"><I.warning size={14}/></span>
            <div>
              <div className="title">Instance administrator</div>
              <div className="text-sm">This user has full administrative access to the GitLab instance.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
