import React, { useEffect } from 'react';
import { useGH } from '../context.jsx';
import { I } from '../icons.jsx';
import { Skeleton, Empty } from '../components.jsx';

export default function Activity() {
  const gh = useGH();
  const loading = gh.loading.activity;

  useEffect(() => {
    if (gh.activity.length === 0 && !loading) gh.loadActivity();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity</h1>
          <div className="page-subtitle">Recent events visible to current token</div>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => gh.loadActivity()}><I.refresh size={13}/> Refresh</button>
        </div>
      </div>

      <div className="table-wrap">
        {loading && gh.activity.length === 0 ? (
          <div>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <Skeleton h={28} w={28} style={{ borderRadius: '50%', flexShrink: 0 }}/>
                <div style={{ flex: 1 }}><Skeleton h={12} w="60%"/></div>
                <Skeleton h={11} w={50}/>
              </div>
            ))}
          </div>
        ) : gh.activity.length === 0 ? (
          <Empty title="No activity" desc="No recent events found." icon={<I.activity size={20}/>}/>
        ) : (
          <div>
            {gh.activity.map((a, i) => (
              <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-1)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className="avatar sm" style={{ flexShrink: 0 }}>{a.avatar}</span>
                <div style={{ flex: 1, fontSize: 13, minWidth: 0 }}>
                  <span className="mono" style={{ fontWeight: 500 }}>@{a.actor}</span>
                  {' '}
                  <span className="muted">{a.text}</span>
                  {' '}
                  <span className="mono text-xs" style={{ color: a.status === 'failed' ? 'var(--red)' : 'var(--text-1)' }}>
                    {a.target}
                  </span>
                </div>
                <span className="mono text-xs muted" style={{ flexShrink: 0 }}>{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
