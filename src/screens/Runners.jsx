import React, { useEffect } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, StatusDot, Skeleton, Empty } from '../components.jsx';

export default function Runners() {
  const gh = useGH();
  const loading = gh.loading.runners;

  useEffect(() => {
    if (gh.runners.length === 0 && !loading) gh.loadRunners();
  }, []);

  const online = gh.runners.filter(r => r.online || r.status === 'online').length;
  const paused = gh.runners.filter(r => r.paused).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Runners</h1>
          <div className="page-subtitle">{gh.runners.length} runners · {online} online · {paused} paused</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => gh.loadRunners()}><I.refresh size={13}/> Refresh</button>
        </div>
      </div>

      <div className="table-wrap">
        {loading && gh.runners.length === 0 ? (
          <div className="table-scroll">
            <table className="gh">
              <thead><tr><th>Name</th><th>Status</th><th>Type</th><th>Platform</th><th>Tags</th></tr></thead>
              <tbody>
                {[0,1,2,3].map(i => (
                  <tr key={i}><td colSpan={5}><Skeleton h={12} w="80%"/></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="gh">
              <thead>
                <tr>
                  <th>Name</th><th>Status</th><th>Type</th><th>Platform</th><th>Tags</th><th>Version</th>
                </tr>
              </thead>
              <tbody>
                {gh.runners.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="mono text-sm" style={{ fontWeight: 500 }}>{r.description || r.name || `runner-${r.id}`}</div>
                      <div className="mono text-xs muted">#{r.id}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <StatusDot status={r.online || r.status === 'online' ? 'online' : r.status === 'paused' ? 'paused' : 'offline'}/>
                        <span className="text-xs">{r.status || (r.online ? 'online' : 'offline')}</span>
                      </div>
                    </td>
                    <td><Badge kind={r.runner_type === 'group_type' ? 'purple' : r.runner_type === 'project_type' ? 'info' : 'neutral'}>{r.runner_type?.replace('_type','') || 'instance'}</Badge></td>
                    <td className="cell-mono">{r.platform || '—'} {r.architecture || ''}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {(r.tag_list || []).slice(0, 4).map(t => <Badge key={t} kind="neutral">{t}</Badge>)}
                      </div>
                    </td>
                    <td className="cell-mono muted">{r.version || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {gh.runners.length === 0 && !loading && (
              <Empty title="No runners" desc="No runners accessible." icon={<I.runner size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
