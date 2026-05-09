import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from './api.js';

// Risk analysis — runs client-side, never persisted
const RISK_KEYWORDS = [
  'SECRET', 'TOKEN', 'PASSWORD', 'PASS', 'PRIVATE_KEY',
  'AWS', 'GCP', 'AZURE', 'DOCKER', 'REGISTRY',
  'PROD', 'DATABASE', 'SSH', 'API_KEY', 'STRIPE',
  'OAUTH', 'JWT', 'SIGNING', 'WEBHOOK',
];

export function analyzeVariables(variables) {
  const findings = [];
  let findingNum = 1000;

  for (const v of variables) {
    const key = v.key.toUpperCase();
    const matched = RISK_KEYWORDS.filter((k) => key.includes(k));
    const isRisky = matched.length > 0;

    if (!v.masked && isRisky) {
      findings.push({
        id: `F-${findingNum++}`,
        severity: 'critical',
        title: `Unmasked secret in CI/CD variable`,
        asset: `${v.sourcePath} → ${v.key}`,
        category: 'variables',
        evidence: `masked=false, key matches [${matched.join(', ')}]`,
        description: `Variable ${v.key} matches sensitive keyword patterns but is not masked. Job logs may leak the value.`,
        recommendation: 'Set masked=true and rotate the secret value.',
        sourceRef: { kind: 'variable', id: v.id },
      });
    }
    if (!v.protected && isRisky) {
      findings.push({
        id: `F-${findingNum++}`,
        severity: 'high',
        title: `Unprotected sensitive variable accessible to all branches`,
        asset: `${v.sourcePath} → ${v.key}`,
        category: 'variables',
        evidence: `protected=false on variable matching [${matched.join(', ')}]`,
        description: `Any branch can read ${v.key}, including unprotected ones — enabling secret exfiltration.`,
        recommendation: 'Set protected=true and limit envScope.',
        sourceRef: { kind: 'variable', id: v.id },
      });
    }
    if (v.raw && isRisky) {
      findings.push({
        id: `F-${findingNum++}`,
        severity: 'critical',
        title: `Raw variable may print secret verbatim`,
        asset: `${v.sourcePath} → ${v.key}`,
        category: 'variables',
        evidence: `raw=true on variable matching [${matched.join(', ')}]`,
        description: `raw=true means GitLab won't escape the value — it can appear verbatim in logs.`,
        recommendation: 'Set raw=false unless required by the tool.',
        sourceRef: { kind: 'variable', id: v.id },
      });
    }
  }

  return findings;
}

export function computeVarRisk(v) {
  const key = v.key.toUpperCase();
  const matched = RISK_KEYWORDS.filter((k) => key.includes(k));
  if (!matched.length) return 'low';
  if (!v.masked || v.raw) return 'critical';
  if (!v.protected) return 'high';
  return 'medium';
}

export function computeVarTags(v) {
  const key = v.key.toUpperCase();
  const tags = RISK_KEYWORDS.filter((k) => key.includes(k)).slice(0, 4);
  if (!v.masked) tags.push('UNMASKED');
  if (!v.protected) tags.push('UNPROTECTED');
  return tags;
}

// ── Context ────────────────────────────────────────────────────────────────
const GHContext = createContext(null);

export function GHProvider({ children }) {
  const [state, setState] = useState({
    connected: false,
    instance: null,      // { url, shortUrl, version }
    tokenUser: null,     // GitLab user object
    projects: [],
    groups: [],
    variables: [],       // enriched with risk/tags/sourcePath
    runners: [],
    users: [],
    activity: [],
    findings: [],
    loading: {},         // { key: bool }
    errors: {},          // { key: string }
  });

  const setLoading = (key, val) =>
    setState((s) => ({ ...s, loading: { ...s.loading, [key]: val } }));
  const setError = (key, val) =>
    setState((s) => ({ ...s, errors: { ...s.errors, [key]: val } }));

  // ── Connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(async (url, token, onStep) => {
    const steps = [
      'Validating token',
      'Fetching user profile',
      'Loading groups',
      'Loading projects',
      'Analyzing permissions',
      'Checking variables access',
      'Building overview',
    ];

    for (let i = 0; i < steps.length; i++) {
      onStep && onStep(i, steps[i]);
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
    }

    const result = await api.connect(url, token);
    if (result.error) throw new Error(result.error);

    const shortUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

    setState((s) => ({
      ...s,
      connected: true,
      instance: { url, shortUrl, version: result.version },
      tokenUser: result.user,
    }));

    return result;
  }, []);

  // ── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    await api.disconnect();
    setState({
      connected: false, instance: null, tokenUser: null,
      projects: [], groups: [], variables: [], runners: [],
      users: [], activity: [], findings: [], loading: {}, errors: {},
    });
  }, []);

  // ── Load projects ─────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    setLoading('projects', true);
    try {
      const raw = await api.projects();
      const projects = raw.map((p) => ({
        id: p.id,
        name: p.name,
        path: p.path,
        namespace: p.namespace?.full_path || p.namespace?.path || '',
        nameWithNamespace: p.name_with_namespace,
        visibility: p.visibility,
        role: accessLevelToRole(p.permissions?.project_access?.access_level ?? p.permissions?.group_access?.access_level),
        defaultBranch: p.default_branch || 'main',
        lastActivity: timeAgo(p.last_activity_at),
        size: formatSize(p.statistics?.repository_size),
        cicd: true,
        vars: 0,
        riskyVars: 0,
        downloadable: true,
        risk: 'low',
        stars: p.star_count || 0,
        forks: p.forks_count || 0,
        desc: p.description || '',
        webUrl: p.web_url,
        sshUrl: p.ssh_url_to_repo,
        httpUrl: p.http_url_to_repo,
      }));
      setState((s) => ({ ...s, projects }));
    } catch (e) {
      setError('projects', e.message);
    } finally {
      setLoading('projects', false);
    }
  }, []);

  // ── Load groups ───────────────────────────────────────────────────────────
  const loadGroups = useCallback(async () => {
    setLoading('groups', true);
    try {
      const raw = await api.groups();
      const groups = raw.map((g) => ({
        id: g.id,
        name: g.name,
        path: g.path,
        fullPath: g.full_path,
        description: g.description || '',
        visibility: g.visibility,
        projects: g.projects_count || 0,
        members: g.members_count || 0,
        role: accessLevelToRole(g.permissions?.access_level),
        risk: 'low',
        webUrl: g.web_url,
      }));
      setState((s) => ({ ...s, groups }));
    } catch (e) {
      setError('groups', e.message);
    } finally {
      setLoading('groups', false);
    }
  }, []);

  // ── Load variables (all projects) ─────────────────────────────────────────
  const loadVariables = useCallback(async (projects) => {
    setLoading('variables', true);
    const allVars = [];

    for (const project of projects) {
      try {
        const vars = await api.projectVariables(project.id);
        for (const v of (Array.isArray(vars) ? vars : [])) {
          const enriched = {
            id: `${project.id}-${v.key}`,
            key: v.key,
            value: v.value || '',
            type: v.variable_type === 'file' ? 'file' : 'env_var',
            envScope: v.environment_scope || '*',
            protected: v.protected || false,
            masked: v.masked || false,
            raw: v.raw || false,
            source: 'project',
            sourcePath: `${project.namespace}/${project.path}`,
            projectId: project.id,
            risk: 'low',
            tags: [],
          };
          enriched.risk = computeVarRisk(enriched);
          enriched.tags = computeVarTags(enriched);
          allVars.push(enriched);
        }
      } catch (_) {}
    }

    // Also fetch group-level variables
    try {
      const groupsSnap = await api.groups();
      for (const g of groupsSnap.slice(0, 10)) {
        try {
          const vars = await api.groupVariables(g.id);
          for (const v of (Array.isArray(vars) ? vars : [])) {
            const enriched = {
              id: `grp-${g.id}-${v.key}`,
              key: v.key,
              value: v.value || '',
              type: v.variable_type === 'file' ? 'file' : 'env_var',
              envScope: v.environment_scope || '*',
              protected: v.protected || false,
              masked: v.masked || false,
              raw: v.raw || false,
              source: 'group',
              sourcePath: g.full_path || g.path,
              groupId: g.id,
              risk: 'low',
              tags: [],
            };
            enriched.risk = computeVarRisk(enriched);
            enriched.tags = computeVarTags(enriched);
            allVars.push(enriched);
          }
        } catch (_) {}
      }
    } catch (_) {}

    const findings = analyzeVariables(allVars);

    // Update project risk based on their variables
    setState((s) => {
      const projectRisks = {};
      for (const v of allVars) {
        if (v.projectId) {
          const cur = projectRisks[v.projectId];
          const levels = { critical: 4, high: 3, medium: 2, low: 1 };
          if (!cur || (levels[v.risk] || 0) > (levels[cur] || 0)) {
            projectRisks[v.projectId] = v.risk;
          }
        }
      }
      const projects = s.projects.map((p) => {
        const pvars = allVars.filter((v) => v.projectId === p.id);
        return {
          ...p,
          vars: pvars.length,
          riskyVars: pvars.filter((v) => v.risk === 'critical' || v.risk === 'high').length,
          risk: projectRisks[p.id] || 'low',
        };
      });
      return { ...s, projects, variables: allVars, findings };
    });

    setLoading('variables', false);
  }, []);

  // ── Load runners ──────────────────────────────────────────────────────────
  const loadRunners = useCallback(async () => {
    setLoading('runners', true);
    try {
      const raw = await api.runners();
      const runners = (Array.isArray(raw) ? raw : []).map((r) => ({
        id: r.id,
        description: r.description || r.name || `runner-${r.id}`,
        type: r.runner_type === 'instance_type' ? 'shared' : r.runner_type === 'group_type' ? 'group' : 'project',
        status: r.status === 'online' ? 'online' : 'offline',
        tags: r.tag_list || [],
        locked: r.locked || false,
        protected: r.access_level === 'ref_protected',
        runUntagged: r.run_untagged || false,
        version: r.version || '—',
        projects: r.project_count || 0,
        risk: r.runner_type === 'instance_type' ? 'high' : 'low',
        active: r.active,
      }));
      setState((s) => ({ ...s, runners }));
    } catch (e) {
      setError('runners', e.message);
    } finally {
      setLoading('runners', false);
    }
  }, []);

  // ── Load users ────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading('users', true);
    try {
      const raw = await api.users();
      const users = (Array.isArray(raw) ? raw : []).map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email || '',
        avatar: initials(u.name),
        avatarUrl: u.avatar_url,
        state: u.state,
        external: u.external || false,
        admin: u.is_admin || false,
        lastActivity: timeAgo(u.last_activity_on || u.last_sign_in_at),
        created: u.created_at ? u.created_at.slice(0, 10) : '—',
        highestRole: 'Member',
        groups: 0,
        projects: 0,
        webUrl: u.web_url,
      }));
      setState((s) => ({ ...s, users }));
    } catch (e) {
      setError('users', e.message);
    } finally {
      setLoading('users', false);
    }
  }, []);

  // ── Load activity ─────────────────────────────────────────────────────────
  const loadActivity = useCallback(async () => {
    setLoading('activity', true);
    try {
      const raw = await api.events({ per_page: 30 });
      const activity = (Array.isArray(raw) ? raw : []).map((e) => {
        const action = e.action_name || 'updated';
        const target = e.target_title || e.project_id || '';
        const status = action.includes('fail') ? 'failed' : action.includes('push') ? 'success' : 'info';
        return {
          type: e.target_type?.toLowerCase() || 'event',
          actor: e.author?.username || e.author_username || '?',
          avatar: initials(e.author?.name || e.author_username || '?'),
          text: action,
          target: `${target}`,
          time: timeAgo(e.created_at),
          status,
        };
      });
      setState((s) => ({ ...s, activity }));
    } catch (e) {
      setError('activity', e.message);
    } finally {
      setLoading('activity', false);
    }
  }, []);

  const value = {
    ...state,
    connect,
    disconnect,
    loadProjects,
    loadGroups,
    loadVariables,
    loadRunners,
    loadUsers,
    loadActivity,
  };

  return <GHContext.Provider value={value}>{children}</GHContext.Provider>;
}

export function useGH() {
  const ctx = useContext(GHContext);
  if (!ctx) throw new Error('useGH must be used inside GHProvider');
  return ctx;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function accessLevelToRole(level) {
  if (level === undefined || level === null) return 'Reporter';
  if (level >= 50) return 'Owner';
  if (level >= 40) return 'Maintainer';
  if (level >= 30) return 'Developer';
  if (level >= 20) return 'Reporter';
  return 'Guest';
}

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function formatSize(bytes) {
  if (!bytes) return '—';
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  if (mb < 1024) return `${Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`;
  return `${Math.floor(mo / 12)} year${Math.floor(mo / 12) === 1 ? '' : 's'} ago`;
}
