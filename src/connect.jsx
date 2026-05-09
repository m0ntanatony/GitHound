import React, { useState } from 'react';
import { useGH } from './context.jsx';
import { Logo } from './components.jsx';
import { I } from './icons.jsx';

export function ConnectScreen({ onConnect }) {
  const gh = useGH();
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | scanning | error
  const [scanStep, setScanStep] = useState(0);
  const [scanLabel, setScanLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const SCAN_STEPS = [
    'Validating token',
    'Fetching user profile',
    'Loading groups',
    'Loading projects',
    'Analyzing permissions',
    'Checking variables access',
    'Building overview',
  ];

  const valid = url.length > 8 && token.length >= 8;

  const handleConnect = async () => {
    if (!valid) return;
    setPhase('scanning');
    setScanStep(0);

    try {
      await gh.connect(url, token, (step, label) => {
        setScanStep(step);
        setScanLabel(label);
      });
      onConnect();
    } catch (err) {
      setErrorMsg(err.message || 'Connection failed');
      setPhase('error');
    }
  };

  return (
    <div className="connect-bg">
      <div className="connect-card">
        <div className="flex items-center gap-3 mb-4" style={{ justifyContent: 'center' }}>
          <Logo size={32}/>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, textAlign: 'center', margin: '8px 0 4px' }}>
          Connect to GitLab
        </h1>
        <p className="text-md muted" style={{ textAlign: 'center', marginBottom: 24 }}>
          Inspect any GitLab instance through a personal access token
        </p>

        {phase === 'idle' && (
          <>
            <div className="mb-3">
              <label className="input-label">GitLab Instance URL</label>
              <input
                className="input mono"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://gitlab.example.com"
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
            </div>
            <div className="mb-3">
              <label className="input-label">Personal Access Token</label>
              <input
                className="input mono"
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
              <div className="input-hint">
                Required scopes: <span className="mono text-red">read_api</span>,{' '}
                <span className="mono">read_repository</span>
              </div>
            </div>
            <button
              className="btn primary lg"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={!valid}
              onClick={handleConnect}
            >
              <I.plug size={14}/> Connect
            </button>
            <div className="alert mt-4" style={{ fontSize: 12 }}>
              <span className="icon"><I.warning size={13}/></span>
              <div>
                <div className="title text-xs">Use only authorized tokens</div>
                <div>GitHound reads everything your token can read. Don't connect to systems you don't have permission to audit.</div>
              </div>
            </div>
          </>
        )}

        {phase === 'scanning' && (
          <div>
            <div className="progress mb-4">
              <div className="progress-bar" style={{ width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%` }}/>
            </div>
            {SCAN_STEPS.map((s, i) => {
              const state = i < scanStep ? 'done' : i === scanStep ? 'run' : 'pending';
              return (
                <div key={i} className={`scan-row ${state}`}>
                  <span className="marker">
                    {state === 'done'    && <I.check  size={12}/>}
                    {state === 'run'     && <span className="spin" style={{ display: 'inline-block', animation: 'spin 0.9s linear infinite' }}><I.loader size={12}/></span>}
                    {state === 'pending' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.4, display: 'inline-block' }}/>}
                  </span>
                  <span className={state === 'done' ? 'muted' : ''}>{s}{state === 'run' ? '…' : ''}</span>
                  {state === 'done' && (
                    <span className="mono text-xs muted" style={{ marginLeft: 'auto' }}>
                      {(Math.random() * 0.8 + 0.1).toFixed(2)}s
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {phase === 'error' && (
          <div>
            <div className="alert" style={{ borderLeftColor: 'var(--red)', marginBottom: 16 }}>
              <span className="icon"><I.alert size={14}/></span>
              <div>
                <div className="title">Connection failed</div>
                <div className="mono text-xs muted mt-1">{errorMsg}</div>
                <div className="mt-2 text-sm">Check the URL and token, then try again.</div>
              </div>
            </div>
            <button
              className="btn lg"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setPhase('idle')}
            >
              <I.arrowL size={13}/> Try again
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
