// API client — all calls proxy through /api/gitlab/* → GitLab
// No data is persisted; everything lives in React state only.

async function req(path, opts = {}) {
  const res = await fetch(`/api/gitlab${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.message || err.error || res.statusText), { status: res.status });
  }
  return res.json();
}

// Paginate through all pages of a GitLab list endpoint
async function fetchAll(path, params = {}) {
  const items = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const qs = new URLSearchParams({ ...params, page, per_page: perPage }).toString();
    const res = await fetch(`/api/gitlab${path}?${qs}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    items.push(...data);
    const totalPages = parseInt(res.headers.get('x-total-pages') || '1', 10);
    if (page >= totalPages || data.length < perPage) break;
    page++;
  }
  return items;
}

export const api = {
  // Generic GET — used by screens that build URLs directly
  get: (path) => req(path),

  // Auth
  connect: (url, token) =>
    fetch('/api/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, token }),
    }).then((r) => r.json()),

  disconnect: () =>
    fetch('/api/disconnect', { method: 'POST' }).then((r) => r.json()),

  session: () => fetch('/api/session').then((r) => r.json()),

  // Core resources
  user: () => req('/user'),
  version: () => req('/version'),

  projects: (params = {}) => fetchAll('/projects', { membership: true, order_by: 'last_activity_at', ...params }),
  project: (id) => req(`/projects/${id}`),

  groups: (params = {}) => fetchAll('/groups', { min_access_level: 10, ...params }),
  group: (id) => req(`/groups/${id}`),
  groupProjects: (id) => fetchAll(`/groups/${id}/projects`, { include_subgroups: true }),

  // Variables — fetch per project, caller handles errors gracefully
  projectVariables: (projectId) => req(`/projects/${encodeURIComponent(projectId)}/variables`).catch(() => []),
  groupVariables: (groupId) => req(`/groups/${encodeURIComponent(groupId)}/variables`).catch(() => []),

  // CI/CD
  pipelines: (projectId, params = {}) =>
    fetchAll(`/projects/${encodeURIComponent(projectId)}/pipelines`, { per_page: 50, ...params }),
  pipeline: (projectId, pipelineId) =>
    req(`/projects/${encodeURIComponent(projectId)}/pipelines/${pipelineId}`),
  pipelineJobs: (projectId, pipelineId) =>
    fetchAll(`/projects/${encodeURIComponent(projectId)}/pipelines/${pipelineId}/jobs`),
  jobs: (projectId, params = {}) =>
    fetchAll(`/projects/${encodeURIComponent(projectId)}/jobs`, { per_page: 50, ...params }),
  jobLog: (projectId, jobId) =>
    fetch(`/api/gitlab/projects/${encodeURIComponent(projectId)}/jobs/${jobId}/trace`).then((r) => r.text()),

  // Runners
  runners: (params = {}) => fetchAll('/runners', { scope: 'all', ...params }).catch(() => req('/runners').catch(() => [])),

  // Users
  users: (params = {}) => fetchAll('/users', params).catch(() => []),

  // Repository
  branches: (projectId) => fetchAll(`/projects/${encodeURIComponent(projectId)}/repository/branches`),
  commits: (projectId, params = {}) =>
    fetchAll(`/projects/${encodeURIComponent(projectId)}/repository/commits`, { per_page: 30, ...params }),
  fileTree: (projectId, path = '', ref = 'HEAD') =>
    req(`/projects/${encodeURIComponent(projectId)}/repository/tree?path=${encodeURIComponent(path)}&ref=${ref}`).catch(() => []),
  fileContent: (projectId, filePath, ref = 'HEAD') =>
    req(`/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}?ref=${ref}`).catch(() => null),
  readme: (projectId, ref = 'HEAD') =>
    fetch(`/api/gitlab/projects/${encodeURIComponent(projectId)}/repository/files/README.md/raw?ref=${ref}`)
      .then((r) => (r.ok ? r.text() : null))
      .catch(() => null),

  // Merge requests
  mergeRequests: (projectId, params = {}) =>
    fetchAll(`/projects/${encodeURIComponent(projectId)}/merge_requests`, { scope: 'all', per_page: 50, ...params }),

  // Activity / events
  events: (params = {}) =>
    fetchAll('/events', { per_page: 50, ...params }).catch(() => []),
};

export default api;
