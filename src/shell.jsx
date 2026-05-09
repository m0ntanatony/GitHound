import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useGH } from './context.jsx';
import { I } from './icons.jsx';
import { Logo, Badge, RiskBadge, Skeleton } from './components.jsx';
import { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSelect, TweakColorSwatches } from './tweaks-panel.jsx';

// Lazy-load heavy screens
const Overview    = lazy(() => import('./screens/Overview.jsx'));
const Projects    = lazy(() => import('./screens/Projects.jsx'));
const Groups      = lazy(() => import('./screens/Groups.jsx'));
const Activity    = lazy(() => import('./screens/Activity.jsx'));
const Variables   = lazy(() => import('./screens/Variables.jsx'));
const Security    = lazy(() => import('./screens/Security.jsx'));
const Runners     = lazy(() => import('./screens/Runners.jsx'));
const Users       = lazy(() => import('./screens/Users.jsx'));
const Permissions = lazy(() => import('./screens/Permissions.jsx'));
const Settings    = lazy(() => import('./screens/Settings.jsx'));
const CICDOverview = lazy(() => import('./screens/CICDOverview.jsx'));
const PipelinesList = lazy(() => import('./screens/PipelinesList.jsx'));
const PipelineDetail = lazy(() => import('./screens/PipelineDetail.jsx'));
const JobsList    = lazy(() => import('./screens/JobsList.jsx'));
const JobDetail   = lazy(() => import('./screens/JobDetail.jsx'));
const Repository  = lazy(() => import('./screens/Repository.jsx'));
const ProjectDetail = lazy(() => import('./screens/ProjectDetail.jsx'));
const GroupDetail = lazy(() => import('./screens/GroupDetail.jsx'));
const Downloads   = lazy(() => import('./screens/Downloads.jsx'));
const MRsList     = lazy(() => import('./screens/MRsList.jsx'));
const Branches    = lazy(() => import('./screens/Branches.jsx'));
const Commits     = lazy(() => import('./screens/Commits.jsx'));
const UserDetail  = lazy(() => import('./screens/UserDetail.jsx'));

const ScreenFallback = () => (
  <div className="page">
    <Skeleton h={28} w={200} style={{ marginBottom: 16 }}/>
    <Skeleton h={14} w={320} style={{ marginBottom: 24 }}/>
    <div className="grid grid-4" style={{ marginBottom: 16 }}>
      {[0,1,2,3].map(i => <Skeleton key={i} h={80}/>)}
    </div>
    <Skeleton h={300}/>
  </div>
);

const NAV_ITEMS = [
  { section: 'WORKSPACE' },
  { key: 'overview',    label: 'Overview',      icon: 'home'     },
  { key: 'projects',    label: 'Projects',       icon: 'folder'   },
  { key: 'groups',      label: 'Groups',         icon: 'group'    },
  { key: 'activity',    label: 'Activity',       icon: 'activity' },
  { section: 'CODE' },
  { key: 'repository',  label: 'Repository',     icon: 'terminal' },
  { key: 'branches',    label: 'Branches',       icon: 'branch'   },
  { key: 'commits',     label: 'Commits',        icon: 'commit'   },
  { key: 'mrs',         label: 'Merge Requests', icon: 'mr'       },
  { section: 'CI / CD' },
  { key: 'cicd',        label: 'CI/CD Overview', icon: 'cicd'     },
  { key: 'pipelines',   label: 'Pipelines',      icon: 'pipeline' },
  { key: 'jobs',        label: 'Jobs',           icon: 'job'      },
  { key: 'runners',     label: 'Runners',        icon: 'runner'   },
  { key: 'variables',   label: 'Variables',      icon: 'vars',    danger: true },
  { section: 'ACCESS' },
  { key: 'users',       label: 'Users',          icon: 'users'    },
  { key: 'permissions', label: 'Permissions',    icon: 'shield'   },
  { key: 'downloads',   label: 'Downloads',      icon: 'download' },
  { section: 'AUDIT' },
  { key: 'security',    label: 'Security',       icon: 'bug',     danger: true },
  { key: 'settings',    label: 'Settings',       icon: 'settings' },
];

export function Shell({ route, routeArg, onNav, tweaks, setTweak }) {
  const gh = useGH();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const inst = gh.instance;
  const user = gh.tokenUser;
  const connState = inst ? 'connected' : 'partial';

  useEffect(() => {
    const h = () => setSearchOpen(false);
    if (searchOpen) document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [searchOpen]);

  const varCount  = gh.variables.length;
  const riskCount = gh.findings.length;

  const sidebarCounts = {
    projects:  gh.projects.length  || null,
    groups:    gh.groups.length    || null,
    variables: varCount            || null,
    security:  riskCount           || null,
    runners:   gh.runners.length   || null,
    mrs:       null,
  };

  let screen = null;
  switch (route) {
    case 'overview':    screen = <Overview onNav={onNav}/>; break;
    case 'projects':    screen = <Projects onNav={onNav}/>; break;
    case 'project':     screen = <ProjectDetail projectId={routeArg} onNav={onNav}/>; break;
    case 'groups':      screen = <Groups onNav={onNav}/>; break;
    case 'group':       screen = <GroupDetail groupId={routeArg} onNav={onNav}/>; break;
    case 'activity':    screen = <Activity/>; break;
    case 'repository':  screen = <Repository/>; break;
    case 'branches':    screen = <Branches/>; break;
    case 'commits':     screen = <Commits/>; break;
    case 'mrs':         screen = <MRsList/>; break;
    case 'cicd':        screen = <CICDOverview onNav={onNav}/>; break;
    case 'pipelines':   screen = <PipelinesList onNav={onNav}/>; break;
    case 'pipeline':    screen = <PipelineDetail pipelineId={routeArg} onNav={onNav}/>; break;
    case 'jobs':        screen = <JobsList onNav={onNav}/>; break;
    case 'job':         screen = <JobDetail jobId={routeArg} onNav={onNav}/>; break;
    case 'runners':     screen = <Runners/>; break;
    case 'variables':   screen = <Variables/>; break;
    case 'users':       screen = <Users onNav={onNav}/>; break;
    case 'user':        screen = <UserDetail userId={routeArg} onNav={onNav}/>; break;
    case 'permissions': screen = <Permissions/>; break;
    case 'downloads':   screen = <Downloads/>; break;
    case 'security':    screen = <Security onNav={onNav}/>; break;
    case 'settings':    screen = <Settings tweaks={tweaks} setTweak={setTweak} onDisconnect={gh.disconnect}/>; break;
    default:            screen = <Overview onNav={onNav}/>;
  }

  return (
    <div className="app">
      {/* Topbar */}
      <div className="topbar app-topbar">
        <div className="topbar-brand">
          <button onClick={() => onNav('overview')} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
            <Logo/>
          </button>
        </div>
        <div className={`topbar-instance ${connState === 'partial' ? 'partial' : connState === 'expired' ? 'expired' : ''}`}>
          <span className="dot"/>
          <span>{inst?.shortUrl || '…'}</span>
          {inst?.version && <span className="dim" style={{ marginLeft: 4 }}>v{inst.version.split('-')[0]}</span>}
        </div>
        <div className="topbar-search" style={{ position: 'relative' }} onClick={() => setSearchOpen(true)}>
          <I.search size={13}/>
          <input
            placeholder="Search projects, variables, users…"
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
          />
          <kbd>⌘K</kbd>
          {searchOpen && searchQ.length > 0 && (
            <SearchDropdown query={searchQ} onClose={() => setSearchOpen(false)} onNav={onNav}/>
          )}
        </div>
        <div className="topbar-spacer"/>
        <div className="topbar-actions">
          <button className="icon-btn tip" data-tip="Refresh data" onClick={() => {
            gh.loadProjects().then(() => gh.loadVariables(gh.projects));
            gh.loadGroups();
            gh.loadActivity();
          }}><I.refresh size={14}/></button>
          {inst?.gitlabUrl && (
            <a href={inst.gitlabUrl} target="_blank" rel="noopener" className="icon-btn tip" data-tip="Open GitLab">
              <I.ext size={14}/>
            </a>
          )}
          <span style={{ width: 1, height: 20, background: 'var(--border-1)', margin: '0 4px' }}/>
          <button className="icon-btn" onClick={() => onNav('settings')}>
            <span className="avatar sm">{user ? (user.name || user.username || '?').slice(0,2).toUpperCase() : '?'}</span>
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <nav className="sidebar app-sidebar">
        {NAV_ITEMS.map((it, i) => {
          if (it.section) return <div key={'s'+i} className="sidebar-section">{it.section}</div>;
          const active = route === it.key;
          const count = sidebarCounts[it.key];
          const Icon = I[it.icon];
          return (
            <button key={it.key} className={`sidebar-item ${active ? 'active' : ''}`} onClick={() => onNav(it.key)}>
              {Icon && <Icon size={14}/>}
              <span>{it.label}</span>
              {count != null && <span className={`count ${it.danger ? 'danger' : ''}`}>{count}</span>}
            </button>
          );
        })}
        <div style={{ marginTop: 'auto', padding: '12px 10px', borderTop: '1px solid var(--border-1)' }}>
          <div className="flex items-center gap-2">
            <span className="avatar sm">{user ? (user.name || user.username || '?').slice(0,2).toUpperCase() : '?'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-xs mono" style={{ color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                @{user?.username || '…'}
              </div>
              <div className="text-xs" style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>● token active</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="app-main">
        <Suspense fallback={<ScreenFallback/>}>
          {screen}
        </Suspense>
      </main>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection title="Appearance">
          <TweakRadio label="Density" value={tweaks.density}
            options={[{value:'compact',label:'Compact'},{value:'comfortable',label:'Comfy'}]}
            onChange={v => setTweak('density', v)}/>
          <TweakColorSwatches label="Accent" value={tweaks.accent} options={[
            {value:'signal', label:'Signal', color:'#FF2D2D'},
            {value:'blood',  label:'Blood',  color:'#8B0000'},
            {value:'amber',  label:'Amber',  color:'#F59E0B'},
          ]} onChange={v => setTweak('accent', v)}/>
        </TweakSection>
        <TweakSection title="Audit">
          <TweakToggle label="Show risk layer" value={tweaks.showRiskLayer} onChange={v => setTweak('showRiskLayer', v)}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// ── Search dropdown ─────────────────────────────────────────────────────────
function SearchDropdown({ query, onClose, onNav }) {
  const gh = useGH();
  const q = query.toLowerCase();
  const projects = gh.projects.filter(p => (p.name+' '+p.namespace).toLowerCase().includes(q)).slice(0, 4);
  const groups   = gh.groups.filter(g => g.name.toLowerCase().includes(q)).slice(0, 3);
  const vars     = gh.variables.filter(v => v.key.toLowerCase().includes(q)).slice(0, 4);
  const users    = gh.users.filter(u => (u.username+' '+u.name).toLowerCase().includes(q)).slice(0, 3);
  const total    = projects.length + groups.length + vars.length + users.length;

  return (
    <div className="search-dropdown" onClick={e => e.stopPropagation()}>
      {projects.length > 0 && (
        <div className="search-group">
          <div className="search-group-label">Projects</div>
          {projects.map(p => (
            <div key={p.id} className="search-result" onClick={() => { onNav('project', p.id); onClose(); }}>
              <I.folder size={13} stroke="var(--text-3)"/>
              <span><div className="title">{p.name}</div><div className="meta">{p.namespace}/{p.path}</div></span>
              <span style={{ marginLeft: 'auto' }}><RiskBadge level={p.risk}/></span>
            </div>
          ))}
        </div>
      )}
      {groups.length > 0 && (
        <div className="search-group">
          <div className="search-group-label">Groups</div>
          {groups.map(g => (
            <div key={g.id} className="search-result" onClick={() => { onNav('group', g.id); onClose(); }}>
              <I.group size={13} stroke="var(--text-3)"/>
              <span><div className="title">{g.name}</div><div className="meta">{g.projects} projects</div></span>
            </div>
          ))}
        </div>
      )}
      {vars.length > 0 && (
        <div className="search-group">
          <div className="search-group-label">Variables</div>
          {vars.map(v => (
            <div key={v.id} className="search-result" onClick={() => { onNav('variables'); onClose(); }}>
              <I.key size={13} stroke="var(--red)"/>
              <span><div className="title mono">{v.key}</div><div className="meta">{v.sourcePath}</div></span>
              <span style={{ marginLeft: 'auto' }}><RiskBadge level={v.risk}/></span>
            </div>
          ))}
        </div>
      )}
      {users.length > 0 && (
        <div className="search-group">
          <div className="search-group-label">Users</div>
          {users.map(u => (
            <div key={u.id} className="search-result" onClick={() => { onNav('user', u.id); onClose(); }}>
              <span className="avatar sm">{(u.name || u.username || '?').slice(0,2).toUpperCase()}</span>
              <span><div className="title">{u.name}</div><div className="meta">@{u.username}</div></span>
            </div>
          ))}
        </div>
      )}
      {total === 0 && (
        <div className="empty" style={{ padding: 30 }}>
          <div className="empty-desc">No results for <span className="mono text-red">"{query}"</span></div>
        </div>
      )}
    </div>
  );
}
