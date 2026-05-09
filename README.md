# GitHound

A dark-themed GitLab security audit tool. Connect to any GitLab instance via a Personal Access Token and inspect CI/CD variables, security findings, pipelines, users, and more — all in real time with no data persistence.

![GitHound](https://img.shields.io/badge/GitLab-Audit-red?style=flat-square&logo=gitlab)
![Docker](https://img.shields.io/badge/docker-compose%20up-blue?style=flat-square&logo=docker)

## Features

- **Variable auditing** — inspect all CI/CD variables across projects and groups, detect risky secrets (tokens, passwords, keys, AWS credentials, etc.)
- **Security findings** — auto-generated findings from pattern analysis, categorized by severity (Critical → Info)
- **Pipeline & job explorer** — browse pipelines, jobs, and logs per project
- **Repository browser** — navigate file trees, branches, commits, and merge requests
- **Runner inventory** — view all runners with status, platform, and tags
- **User & permission audit** — inspect users, admin flags, 2FA status, and token scopes
- **Zero persistence** — all data lives in React state only; session destroyed on disconnect

## Quick Start

```bash
docker compose up
```

Open [http://localhost:3000](http://localhost:3000), enter your GitLab instance URL and a Personal Access Token.

**Required token scopes:** `read_api`, `read_repository`

## Development

```bash
npm install
npm run dev     # Vite (port 5173) + Express (port 3000) via concurrently
```

## Architecture

```
browser  ──►  Vite / React (SPA)
                │
                │  /api/*
                ▼
             Express (server.js)
                │  in-memory session (token never hits disk)
                │  /api/gitlab/* → proxy
                ▼
          GitLab instance API
```

- **Frontend** — Vite + React 18, lazy-loaded screens, IBM Plex Sans/Mono
- **Backend** — Express proxy; `PRIVATE-TOKEN` injected server-side; `express-session` with no store
- **No database** — zero writes to disk; all fetched data cleared on disconnect

## Screens

| Section | Screens |
|---------|---------|
| Workspace | Overview, Projects, Groups, Activity |
| Code | Repository, Branches, Commits, Merge Requests |
| CI/CD | CI/CD Overview, Pipelines, Jobs, Runners, Variables |
| Access | Users, Permissions, Downloads |
| Audit | Security, Settings |

## Security Notice

Only connect to GitLab instances you are authorized to audit. GitHound reads everything your token can access.
