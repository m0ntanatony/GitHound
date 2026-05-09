import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from './api.js';

// Risk analysis — runs client-side, never persisted
const RISK_KEYWORDS = [
  'SECRET', 'TOKEN', 'PASSWORD', 'PASS', 'PRIVATE_KEY',
  'AWS', 'GCP', 'AZURE', 'DOCKER', 'REGISTRY',
  'PROD', 'DATABASE', 'SSH', 'API_KEY', 'STRIPE',
  'OAUTH', 'JWT', 'SIGNING', 'WEBHOOK', 'CREDENTIAL',
  'PRIVATE', 'CERTIFICATE', 'CERT', 'PEM', 'KEY',
  'AUTH', 'ACCESS_KEY', 'SECRET_KEY',
];

// Regex patterns matched against variable VALUES to detect actual secret material
const VALUE_PATTERNS = [
  { label: 'AWS Access Key ID',     re: /\bAKIA[0-9A-Z]{16}\b/,                             sev: 'critical' },
  { label: 'AWS Secret Access Key', re: /[A-Za-z0-9+/]{40}={0,2}/,                          sev: 'high'     },
  { label: 'Private Key Block',     re: /-----BEGIN (?:\w+ )?PRIVATE KEY/,                   sev: 'critical' },
  { label: 'GitLab PAT',            re: /\bglpat-[A-Za-z0-9_-]{20,}/,                       sev: 'critical' },
  { label: 'GitHub Token',          re: /\bgh[pousr]_[A-Za-z0-9]{36,}/,                     sev: 'critical' },
  { label: 'Stripe Secret Key',     re: /\bsk_(?:live|test)_[0-9A-Za-z]{24,}/,              sev: 'critical' },
  { label: 'Google API Key',        re: /\bAIza[0-9A-Za-z_-]{35}\b/,                        sev: 'high'     },
  { label: 'JWT Token',             re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,     sev: 'high'     },
  { label: 'Slack Webhook URL',     re: /hooks\.slack\.com\/services\/[A-Z0-9]{9,}\//,      sev: 'high'     },
  { label: 'Discord Webhook URL',   re: /discord(?:app)?\.com\/api\/webhooks\/\d{17,19}\//,  sev: 'medium'   },
  { label: 'Telegram Bot Token',    re: /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/,                  sev: 'high'     },
  { label: 'Credentials in URL',    re: /https?:\/\/[^:@\s]{2,}:[^@\s]{4,}@[a-z]/,          sev: 'high'     },
  { label: 'Stripe Public Key',     re: /\bpk_(?:live|test)_[0-9A-Za-z]{24,}/,              sev: 'medium'   },
  { label: 'NPM Token',             re: /\bnpm_[A-Za-z0-9]{36}\b/,                          sev: 'high'     },
  { label: 'Heroku API Key',        re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/, sev: 'medium' },
];

export function scanValueForSecrets(value) {
  if (!value) return [];
  return VALUE_PATTERNS.filter((p) => p.re.test(value));
}

export function analyzeVariables(variables) {
  const findings = [];
  let findingNum = 1000;

  for (const v of variables) {
    const key = v.key.toUpperCase();
    const matched = RISK_KEYWORDS.filter((k) => key.includes(k));
    const isRisky = matched.length > 0;

    // Value-based secret pattern detection (highest priority)
    const valueHits = scanValueForSecrets(v.value);
    if (valueHits.length > 0) {
      findings.push({
        id: `F-${findingNum++}`,
        severity: valueHits[0].sev,
        title: `Secret pattern detected in variable value: ${valueHits[0].label}`,
        asset: `${v.sourcePath} → ${v.key}`,
        category: 'secret-exposure',
        evidence: `Value matches pattern "${valueHits[0].label}"`,
        description: `The value of ${v.key} contains what appears to be a ${valueHits[0].label}. This credential is directly readable via the GitLab API with the current token.`,
        recommendation: 'Rotate this credential immediately. Use a secrets manager instead of CI/CD variables.',
        sourceRef: { kind: 'variable', id: v.id },
      });
    }

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
        description: `Any branch can read ${v.key}, including unprotected ones — enabling secret exfiltration via CI/CD jobs.`,
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
    // File-type variable containing sensitive key — often holds PEM/cert files
    if (v.type === 'file' && isRisky) {
      findings.push({
        id: `F-${findingNum++}`,
        severity: 'high',
        title: `File-type variable may contain key material`,
        asset: `${v.sourcePath} → ${v.key}`,
        category: 'variables',
        evidence: `variable_type=file, key matches [${matched.join(', ')}]`,
        description: `File-type variables often contain PEM files, certificates, or credentials written to disk during CI. Value is readable via API.`,
        recommendation: 'Audit file contents. Use masked+protected if possible.',
        sourceRef: { kind: 'variable', id: v.id },
      });
    }
    // Risky variable scoped to all environments
    if (isRisky && v.envScope === '*') {
      findings.push({
        id: `F-${findingNum++}`,
        severity: 'medium',
        title: `Sensitive variable exposed to all environments`,
        asset: `${v.sourcePath} → ${v.key}`,
        category: 'variables',
        evidence: `environment_scope=*, key matches [${matched.join(', ')}]`,
        description: `${v.key} is available in every environment including dev/staging — increasing blast radius of a breach.`,
        recommendation: 'Scope to production environment only.',
        sourceRef: { kind: 'variable', id: v.id },
      });
    }
    // Group-level risky variable cascades to all child projects
    if (v.source === 'group' && isRisky) {
      findings.push({
        id: `F-${findingNum++}`,
        severity: 'high',
        title: `Group-level secret cascades to all child projects`,
        asset: `${v.sourcePath} (group) → ${v.key}`,
        category: 'variables',
        evidence: `source=group, key matches [${matched.join(', ')}]`,
        description: `Group variables are inherited by every project in the group. ${v.key} is accessible to any CI job across all child projects.`,
        recommendation: 'Move to project-level or use a secrets manager with explicit grants.',
        sourceRef: { kind: 'variable', id: v.id },
      });
    }
  }

  return findings;
}

export function computeVarRisk(v) {
  const key = v.key.toUpperCase();
  const matched = RISK_KEYWORDS.filter((k) => key.includes(k));
  const valueHits = scanValueForSecrets(v.value);
  if (valueHits.length > 0) return valueHits[0].sev === 'critical' ? 'critical' : 'high';
  if (!matched.length) return 'none';
  if (!v.masked || v.raw) return 'critical';
  if (!v.protected) return 'high';
  if (v.source === 'group') return 'high';
  return 'medium';
}

export function computeVarTags(v) {
  const key = v.key.toUpperCase();
  const tags = RISK_KEYWORDS.filter((k) => key.includes(k)).slice(0, 3);
  const valueHits = scanValueForSecrets(v.value);
  if (valueHits.length > 0) tags.unshift(valueHits[0].label.toUpperCase().replace(/ /g, '_').slice(0, 12));
  if (!v.masked) tags.push('UNMASKED');
  if (!v.protected) tags.push('UNPROTECTED');
  if (v.type === 'file') tags.push('FILE');
  return tags.slice(0, 5);
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
