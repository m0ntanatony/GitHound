import React, { useEffect, useState } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Badge, Skeleton, Empty } from '../components.jsx';
import api from '../api.js';

const EVENT_KEYS = [
  'push_events', 'issues_events', 'merge_requests_events',
  'tag_push_events', 'note_events', 'job_events',
  'pipeline_events', 'wiki_page_events', 'deployment_events',
];

// Detect secrets potentially embedded in webhook URLs
function auditWebhookUrl(url) {
  if (!url) return [];
  const hits = [];
  if (/[?&](?:token|secret|key|password|auth)=[^&\s]{4,}/i.test(url)) hits.push('token in query param');
  if (/https?:\/\/[^:@\s]+:[^@\s]{4,}@/.test(url)) hits.push('credentials in URL');
  if (/hooks\.slack\.com\/services\//.test(url)) hits.push('Slack webhook');
  if (/discord(?:app)?\.com\/api\/webhooks\//.test(url)) hits.push('Discord webhook');
  return hits;
}

export default function Webhooks() {
  const gh = useGH();
  const [hooks, setHooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [scope, setScope] = useState('project');

  const targetProject = projectId || (gh.projects[0]?.id || '');
  const targetGroup   = gh.groups[0]?.id;

  useEffect(() => {
    if (scope === 'project' && !targetProject) return;
    if (scope === 'group' && !targetGroup) return;
    setLoading(true);
    const endpoint = scope === 'group'
      ? `/groups/${targetGroup}/hooks`
      : `/projects/${targetProject}/hooks`;
    api.get(endpoint + '?per_page=100')
      .then(data => { setHooks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setHooks([]); setLoading(false); });
  }, [targetProject, targetGroup, scope]);

  const riskyHooks = hooks.filter(h => auditWebhookUrl(h.url).length > 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Webhooks</h1>
          <div className="page-subtitle">Outbound webhooks may expose internal systems and embed credentials in URLs</div>
        </div>
      </div>

      {riskyHooks.length > 0 && (
        <div className="alert mb-4" style={{ borderLeftColor: 'var(--red)' }}>
          <span className="icon"><I.warning size={14}/></span>
          <div>
            <div className="title">{riskyHooks.length} webhook{riskyHooks.length > 1 ? 's' : ''} with potentially embedded credentials</div>
            <div className="text-sm">Token/secret values found in webhook URLs. These are stored in plain text and visible to anyone who can read webhooks.</div>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="flex gap-2">
            <button className={`filter-chip ${scope === 'project' ? 'active' : ''}`} onClick={() => setScope('project')}>Project</button>
            <button className={`filter-chip ${scope === 'group' ? 'active' : ''}`} onClick={() => setScope('group')}>Group</button>
          </div>
          {scope === 'project' && (
            <select className="filter-chip" value={projectId} onChange={e => setProjectId(e.target.value)}>
              {gh.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <span style={{ marginLeft: 'auto' }} className="mono text-xs muted">{hooks.length} webhooks</span>
        </div>

        {loading ? (
          <div>{[0,1,2].map(i => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-1)' }}>
              <Skeleton h={13} w="60%" style={{ marginBottom: 6 }}/><Skeleton h={10} w="30%"/>
            </div>
          ))}</div>
        ) : (
          <div>
            {hooks.map(h => {
              const audit = auditWebhookUrl(h.url);
              const events = EVENT_KEYS.filter(k => h[k]);
              return (
                <div key={h.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-1)' }}>
                  <div className="flex items-start gap-3">
                    <I.link size={14} stroke={audit.length ? 'var(--red)' : 'var(--text-3)'} style={{ marginTop: 2, flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 mb-1">
                        {audit.length > 0 && <Badge kind="danger">CREDENTIALS EXPOSED</Badge>}
                        {h.enable_ssl_verification === false && <Badge kind="warning">NO SSL VERIFY</Badge>}
                        {h.token && <Badge kind="warning">SECRET TOKEN SET</Badge>}
                      </div>
                      <div className="mono text-sm" style={{ wordBreak: 'break-all', marginBottom: 6 }}>{h.url}</div>
                      {audit.length > 0 && (
                        <div className="mono text-xs" style={{ color: 'var(--red)', marginBottom: 6 }}>
                          ⚠ {audit.join(' · ')}
                        </div>
                      )}
                      <div className="flex gap-1 flex-wrap">
                        {events.map(e => (
                          <Badge key={e} kind="neutral">{e.replace('_events', '').replace('_', '-')}</Badge>
                        ))}
                      </div>
                    </div>
                    <span className="mono text-xs muted" style={{ flexShrink: 0 }}>
                      {h.created_at ? new Date(h.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              );
            })}
            {hooks.length === 0 && !loading && (
              <Empty title="No webhooks" desc="No webhooks configured." icon={<I.link size={20}/>}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
