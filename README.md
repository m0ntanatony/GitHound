# GitHound

> **GitLab security audit tool for red teams and security engineers.**  
> Connect any GitLab instance via a Personal Access Token. Enumerate secrets, map attack surface, export findings. No data ever touches disk.

[![Docker](https://img.shields.io/badge/docker%20compose%20up-ready-blue?style=flat-square&logo=docker)](https://docs.docker.com/compose/)
[![Node](https://img.shields.io/badge/node-20-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](#license)

---

## Table of Contents

- [Use Cases](#use-cases)
- [Quick Start](#quick-start)
- [Features](#features)
- [Security Model](#security-model)
- [Screens](#screens)
- [Architecture](#architecture)
- [Secret Detection Patterns](#secret-detection-patterns)
- [Development](#development)
- [Environment Variables](#environment-variables)
- [Legal Notice](#legal-notice)
- [License](#license)

---

## Use Cases

| Scenario | What GitHound does |
|---|---|
| **Found a GitLab PAT** | Instantly enumerate all accessible projects, groups, variables, and runners. Identify what the token can read, write, or execute. |
| **Internal red team** | Map CI/CD variable exposure, detect secrets in values, audit deploy keys and webhooks for pivot paths. |
| **Security audit** | Generate structured Markdown or JSON reports for client deliverables directly from the UI. |
| **Pentest scoping** | Token Attack Surface card on Overview gives an immediate risk summary — admin? writable? how many live secrets? |
| **Blue team hardening** | Identify unmasked/unprotected variables, group-level secret cascade, no-2FA admins before an attacker does. |

---

## Quick Start

**Requires:** Docker + Docker Compose

```bash
git clone https://github.com/m0ntanatony/GitHound.git
cd GitHound
docker compose up
```

Open **http://localhost:3000**, enter your GitLab instance URL and a Personal Access Token, and click **Connect**.

**Minimum required token scopes:** `read_api`, `read_repository`

An admin token (`sudo` scope) unlocks additional enumeration capabilities.

---

## Features

### Secret Detection
- **Value-based scanning** — 15 regex patterns applied to actual variable *values*, not just key names. Detects AWS keys, RSA private keys, GitLab/GitHub PATs, Stripe secrets, Google API keys, JWTs, Slack/Discord webhooks, Telegram bot tokens, NPM tokens, credentials-in-URLs, and more.
- **Key-name heuristics** — 20+ keyword patterns (`SECRET`, `TOKEN`, `PASSWORD`, `AWS`, `PRIVATE_KEY`, etc.) as a secondary signal.
- **Finding categories** — unmasked secrets, unprotected variables, raw-mode leak, file-type variable with key material, all-environment scope, group cascade inheritance.

### Attack Surface Mapping
- **Token Attack Surface card** — on connect, immediately shows: admin flag, token write access, count of secrets found in values, live runners, admin accounts, users without 2FA.
- **Deploy Keys** — per-project SSH deploy key inventory with write-access flag, fingerprint, and expiry audit.
- **Webhooks** — detect embedded credentials in webhook URLs, SSL verification bypass, and exposed internal endpoints.
- **Artifacts browser** — enumerate and download pipeline job artifacts; `dotenv` and `secret_detection` artifact types are flagged.

### Reporting
- **Export Markdown** — structured pentest report with finding details, severity, evidence, and risky variable table.
- **Export JSON** — machine-readable report for integration with vulnerability management systems.

### Full GitLab Enumeration
- Projects, groups, group membership, project details
- CI/CD pipelines, jobs, job logs
- Repository file tree, branches, commits, merge requests
- Runners (type, status, platform, tags, version)
- Users (admin flag, 2FA status, last sign-in)
- Token scopes and permissions
- Downloads (repository archives in all formats)

---

## Security Model

GitHound is designed so that **no secret ever touches disk**:

```
Token entered in browser
        │
        ▼ HTTPS POST /api/connect
Express server validates against GitLab API
        │
        ▼  Stored in express-session (RAM only, no store)
All /api/gitlab/* requests inject PRIVATE-TOKEN server-side
        │
        ▼
GitLab API responds → forwarded to browser → held in React state
        │
        ▼  On disconnect / tab close
req.session.destroy() — RAM cleared, nothing persisted
```

- The token is **never written to any file, database, or log**.
- All fetched data lives exclusively in browser React state.
- Session is destroyed immediately on disconnect.
- The session secret should be changed via `SESSION_SECRET` environment variable in production.

---

## Screens

### WORKSPACE
| Screen | Description |
|---|---|
| **Overview** | Dashboard: token identity, access summary, risk severity chart, top findings, recent activity, token attack surface card |
| **Projects** | All accessible projects with visibility, risk badge, star count; click-through to project detail |
| **Groups** | Group list with member count, visibility; drill into members and child projects |
| **Activity** | Real-time event feed (pushes, pipeline runs, MR activity) |

### CODE
| Screen | Description |
|---|---|
| **Repository** | Navigate repository file tree with breadcrumb navigation |
| **Branches** | Branch list with protection status, default branch, last commit author |
| **Commits** | Recent commits with author and date |
| **Merge Requests** | Open/merged/closed MRs with state badges |

### CI / CD
| Screen | Description |
|---|---|
| **CI/CD Overview** | Recent pipeline activity across top 5 projects + runner status |
| **Pipelines** | Per-project pipeline list with status, branch, SHA, triggered-by |
| **Jobs** | Per-project job list with status filter; click through to log |
| **Runners** | Full runner inventory: type, status, platform, architecture, version, tags |
| **Variables** | All CI/CD variables across all projects and groups; two-step reveal flow; filter by risk/masked/protected/env |

### ACCESS
| Screen | Description |
|---|---|
| **Users** | All visible users with admin flag, state, 2FA status |
| **Permissions** | Current token scopes with risk rating per scope |
| **Deploy Keys** | Per-project SSH deploy keys: write access, fingerprint, expiry |
| **Webhooks** | Project and group webhooks; detects embedded credentials and SSL bypass |
| **Artifacts** | Pipeline job artifacts with download links; flags `dotenv` and secret detection reports |
| **Downloads** | Repository archive downloads (tar.gz, zip, etc.) |

### AUDIT
| Screen | Description |
|---|---|
| **Security** | All auto-generated findings by severity; filter by category; finding detail drawer; **export Markdown / JSON** |
| **Settings** | Session info, data summary, disconnect |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│  React 18 SPA (Vite)                                    │
│  ├── GHProvider (React Context — all state lives here)  │
│  ├── Shell (sidebar nav, topbar, search)                │
│  ├── 26 lazy-loaded screens                             │
│  └── Client-side secret analysis (no server involved)  │
└───────────────────┬─────────────────────────────────────┘
                    │  fetch /api/*
┌───────────────────▼─────────────────────────────────────┐
│                   Express Server (server.js)             │
│                                                         │
│  POST /api/connect     — validate token, init session   │
│  POST /api/disconnect  — destroy session                │
│  GET  /api/session     — check connection state         │
│  ALL  /api/gitlab/*    — proxy with PRIVATE-TOKEN       │
│                                                         │
│  Session: express-session, in-memory only (no store)    │
│  Static:  serves dist/ in production                    │
└───────────────────┬─────────────────────────────────────┘
                    │  HTTPS + PRIVATE-TOKEN header
┌───────────────────▼─────────────────────────────────────┐
│              GitLab Instance API (/api/v4/*)             │
└─────────────────────────────────────────────────────────┘
```

**Stack:**

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, IBM Plex Sans/Mono |
| Backend | Node.js 20, Express 4 |
| Session | `express-session` (in-memory, no store) |
| HTTP client | `node-fetch@2` (server) / browser `fetch` (client) |
| Containerization | Docker multi-stage build, Docker Compose |

---

## Secret Detection Patterns

Value-based patterns applied to every variable value on load:

| Pattern | Severity |
|---|---|
| AWS Access Key ID (`AKIA...`) | Critical |
| RSA / EC / OpenSSH Private Key Block | Critical |
| GitLab Personal Access Token (`glpat-...`) | Critical |
| GitHub Token (`ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_`) | Critical |
| Stripe Secret Key (`sk_live_...`, `sk_test_...`) | Critical |
| Google API Key (`AIza...`) | High |
| JWT Token (`eyJ...`) | High |
| Slack Webhook URL | High |
| Telegram Bot Token | High |
| Credentials embedded in URL (`http://user:pass@host`) | High |
| NPM Automation Token (`npm_...`) | High |
| AWS Secret Access Key (40-char base64) | High |
| Discord Webhook URL | Medium |
| Stripe Public Key (`pk_live_...`) | Medium |
| Heroku API Key (UUID format) | Medium |

Key-name heuristics (applied independently): `SECRET`, `TOKEN`, `PASSWORD`, `PASS`, `PRIVATE_KEY`, `AWS`, `GCP`, `AZURE`, `DOCKER`, `REGISTRY`, `DATABASE`, `SSH`, `API_KEY`, `STRIPE`, `OAUTH`, `JWT`, `SIGNING`, `WEBHOOK`, `CREDENTIAL`, `CERT`, `PEM`, `AUTH`, `ACCESS_KEY`.

---

## Development

```bash
git clone https://github.com/m0ntanatony/GitHound.git
cd GitHound
npm install
npm run dev
```

Starts:
- **Vite dev server** on `http://localhost:5173` (HMR, proxies `/api` to Express)
- **Express** on `http://localhost:3000`

**Build for production:**
```bash
npm run build       # outputs to dist/
NODE_ENV=production node server.js
```

**Docker build:**
```bash
docker compose up --build
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port Express listens on |
| `NODE_ENV` | `development` | Set to `production` to serve `dist/` |
| `SESSION_SECRET` | `githound-secret-change-me` | **Change this in production** |

`SESSION_SECRET` is the only value worth setting. There are no other secrets — the GitLab token is supplied at runtime by the user and kept in session RAM.

---

## Legal Notice

GitHound is a security audit and research tool. Use it **only against GitLab instances you own or have explicit written authorization to test**. Unauthorized access to computer systems is a criminal offence in most jurisdictions.

The authors accept no liability for misuse.

---

## License

MIT — see [LICENSE](LICENSE).
