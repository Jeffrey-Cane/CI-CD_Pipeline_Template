# Implementation Plan — Reusable CI/CD Pipeline Template (Community Edition)

This is a **collaborative, open-source** project. The goal is a **GitHub template repository**
that any backend project (Node.js, Python, Java, Go, .NET, etc.) can adopt by changing only
project-specific details (build commands, ports, deployment target).

This document is written so that **multiple contributors can work in parallel**. It defines the
architecture, breaks the work into independent **workstreams** that contributors can claim, and
explains how we coordinate, review, and make decisions together.

---

## Table of Contents

1. [Vision & Principles](#1-vision--principles)
2. [How to Get Involved (Start Here)](#2-how-to-get-involved-start-here)
3. [Repository Layout](#3-repository-layout)
4. [Configuration Surface](#4-configuration-surface)
5. [Workstreams (Claimable Units of Work)](#5-workstreams-claimable-units-of-work)
6. [Dependencies Between Workstreams](#6-dependencies-between-workstreams)
7. [Contribution Workflow](#7-contribution-workflow)
8. [Coding & Repo Standards](#8-coding--repo-standards)
9. [Governance & Decision Making](#9-governance--decision-making)
10. [Roadmap & Milestones](#10-roadmap--milestones)
11. [Good First Issues](#11-good-first-issues)

---

## 1. Vision & Principles

- **Treat the pipeline as a product.** Stable stages, swappable project details.
- **Fail fast, fail cheap.** Cheap checks (lint, unit tests) run before expensive ones
  (image build, DAST scans, deploy).
- **Security shifted left.** Container scanning (Trivy) and DAST (ZAP) run on every push.
- **Reproducible everywhere.** Everything runs inside Docker so local == CI == prod.
- **Convention over configuration.** Sensible defaults; override via a single config surface.
- **Built in the open.** Decisions, designs, and discussions happen in issues and PRs.

### Success Criteria

- A new project can fork/copy the template and get a green pipeline within ~30 minutes of edits.
- All 10 stages from the mockup are represented and individually toggleable.
- Reports (tests, Trivy, ZAP) are published as build artifacts.
- The pipeline blocks merges/deploys on HIGH/CRITICAL findings (configurable).
- Any contributor can pick up a workstream issue and ship it without blocking on the maintainers.

---

## 2. How to Get Involved (Start Here)

New here? Follow this path:

1. **Read** this plan.
2. **Skim open issues** and look for the `good first issue` and `help wanted` labels.
3. **Claim a task** by commenting on its issue (or opening one from a workstream below).
   We assign on a first-come basis to avoid duplicate work.
4. **Join the discussion** in GitHub Discussions for design questions before large changes.
5. **Open a draft PR early** so others can see direction and give feedback.

> First contribution? Pick something from [Good First Issues](#11-good-first-issues).

Files we still need to create to support contributors (tracked in **Workstream G**):
`README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, issue/PR templates,
and a `CODEOWNERS` file.

---

## 3. Repository Layout

```
template-ci-cd/
│
├── app/                       # Sample/reference application (swap per project)
├── tests/
│   ├── unit/
│   └── integration/
│
├── Dockerfile
├── docker-compose.yml         # backend + postgres + redis + zap + integration runner
├── .dockerignore
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml             # Stages 1–7 (quality → publish)
│   │   └── deploy.yml         # Stages 8–10 (deploy → smoke → notify)
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
│
├── zap/
│   └── zap.yaml               # ZAP Automation Framework plan
│
├── trivy/
│   └── trivy.yaml             # Trivy scan config + severity gates
│
├── scripts/
│   ├── smoke-test.sh
│   └── wait-for-healthy.sh
│
├── reports/                   # Generated artifacts (gitignored, produced in CI)
│
├── .env.example
├── pipeline.config.yml        # Single override surface (ports, commands, image name)
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── implementation-plan.md
└── mockup_plan.md
```

---

## 4. Configuration Surface

Centralize all project-specific values so the workflows stay generic. This is the **only** file
adopters should need to edit.

`pipeline.config.yml`:

```yaml
app:
  name: myapp
  language: node            # node | python | java | go | dotnet
  port: 8080
  health_path: /health

commands:
  install: npm ci
  lint: npm run lint
  format_check: npm run format:check
  unit_test: npm test
  build: npm run build

docker:
  image: ghcr.io/OWNER/myapp
  context: .
  dockerfile: Dockerfile

scan:
  trivy_fail_on: HIGH,CRITICAL
  zap_target: http://app:8080

deploy:
  target: compose            # compose | k8s | vps | cloud-vm
  environment: staging       # production | staging | preview

notify:
  channel: slack             # slack | email | teams | discord
```

---

## 5. Workstreams (Claimable Units of Work)

Each workstream is a self-contained area of work with a clear deliverable and acceptance
criteria. Contributors **claim a workstream (or a task within it)** via an issue. Workstreams are
designed to minimize overlap so people can work in parallel.

> Legend: 🟢 good for newcomers · 🟡 intermediate · 🔴 advanced/architectural

### Workstream A — Reference Application & Container 🟢🟡
Maps to mockup Stages 1–2 (build foundation).
- Minimal `app/` HTTP service exposing `/` and `/health`.
- Multi-stage `Dockerfile` (slim runtime, non-root user) + `.dockerignore`.
- **Acceptance:** `docker build` succeeds; container serves `/health` → 200.

### Workstream B — Code Quality Stage 🟢
Maps to mockup Stage 1.
- Lint → format check → static analysis → unit tests.
- Language-appropriate tooling (ESLint/Black/Ruff/pytest/JUnit/Jest).
- Emit JUnit-style report into `reports/`.
- **Acceptance:** `ci.yml` `quality` job runs and uploads a test report artifact.

### Workstream C — Image Build & Container Scan 🟡
Maps to mockup Stages 2–3.
- Build image tagged `${GITHUB_SHA}` (+ `latest` on default branch).
- Trivy scan via `trivy/trivy.yaml`; **gate** on HIGH/CRITICAL (configurable).
- Output SARIF + table report.
- **Acceptance:** build fails on disallowed severities; report uploaded.

### Workstream D — Compose Stack & Integration Tests 🟡
Maps to mockup Stages 4–5 and the suggested Docker network.
- `docker-compose.yml`: `app`, `postgres`, `redis`, `zap`, `integration` on an internal network.
- `scripts/wait-for-healthy.sh`.
- API + DB + auth integration tests; report into `reports/`.
- **Acceptance:** full stack starts in CI; integration job green with uploaded report.

### Workstream E — DAST (ZAP Autonomous Scan) 🔴
Maps to mockup Stage 6.
- `zap/zap.yaml` Automation Framework plan: spider → passiveScan-wait → activeScan → report.
- Run ZAP container against `app` over internal network; publish HTML + JSON.
- Optional alert-threshold gate.
- **Acceptance:** `zap` job produces DAST reports as artifacts.

### Workstream F — Publish, Deploy, Smoke & Notify 🔴
Maps to mockup Stages 7–10.
- Publish image to registry (GHCR default; Docker Hub/ACR optional) on green pipeline.
- `deploy.yml`: deploy to configured target/environment.
- `scripts/smoke-test.sh` (`/`, `/health`, login/logout → 200) + health check.
- Notifications (Slack/Email/Teams/Discord) with build, commit, results, vulns, deploy URL.
- **Acceptance:** end-to-end deploy to staging with smoke test + notification.

### Workstream G — Community & Docs 🟢
Project-wide enablement (no pipeline dependency).
- `README.md` (architecture diagram, "adopt in 4 steps", stage reference).
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `LICENSE`.
- `.github/ISSUE_TEMPLATE/`, `PULL_REQUEST_TEMPLATE.md`, `CODEOWNERS`.
- **Acceptance:** a newcomer can onboard and open a valid PR using the templates.

### Workstream H — Multi-Language Adapters 🟡 (ongoing)
Make the template truly polyglot.
- Provide `pipeline.config.yml` presets + example `app/` for Node, Python, Java, Go, .NET.
- **Acceptance:** at least two language presets pass the full pipeline.

### Workstream I — Meta-CI (testing the template itself) 🔴
- A workflow that validates the template repo on every PR (lint configs, render workflows,
  run the sample pipeline end-to-end).
- **Acceptance:** PRs to this repo are gated by the meta-CI.

---

## 6. Dependencies Between Workstreams

```
G (Community & Docs) ─ independent, start anytime
A (App + Container)
   └─▶ B (Quality)        runs on the app
   └─▶ C (Build + Scan)   needs the image
          └─▶ D (Compose + Integration)
                 └─▶ E (ZAP/DAST)
                        └─▶ F (Publish/Deploy/Smoke/Notify)
H (Language adapters)  ─ depends on A–F existing, then expands them
I (Meta-CI)            ─ depends on enough of A–F to be worth gating
```

Parallel-friendly starting points with no blockers: **A**, **G**, and the scaffolding parts of
**C/D/E** (config files like `trivy.yaml`, `zap.yaml`, compose skeleton) can be drafted ahead of
integration.

---

## 7. Contribution Workflow

1. **Find/claim an issue.** Comment to claim; maintainers (or you) add the matching workstream label.
2. **Branch naming:** `workstream-<letter>/<short-description>`
   (e.g. `workstream-c/trivy-gate`).
3. **Open a draft PR early.** Link the issue (`Closes #123`). Keep PRs focused and reviewable.
4. **CI must pass** (once Workstream I exists) and at least **one maintainer review** is required.
5. **Squash merge** with a Conventional Commit title.
6. **Update docs** in the same PR when behavior changes.

### Commit Convention
Use [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `docs:`, `chore:`, `ci:`, `refactor:`, `test:`.

---

## 8. Coding & Repo Standards

- **Shell scripts:** POSIX-friendly, `set -euo pipefail`, pass `shellcheck`.
- **YAML:** 2-space indent, lint with `yamllint`.
- **Workflows:** keep logic in `scripts/` where possible so it's testable locally.
- **No secrets in the repo.** Use GitHub Actions secrets / OIDC; document required secrets in `README.md`.
- **Every stage toggleable** via `pipeline.config.yml` flags so lean projects can run a subset.

---

## 9. Governance & Decision Making

- **Roles:**
  - *Maintainers* — review/merge rights, own `CODEOWNERS` areas, triage issues.
  - *Contributors* — anyone with a merged or in-flight PR.
- **Small changes:** normal PR review (one maintainer approval).
- **Significant/architectural changes:** open a **Discussion or RFC issue** first; reach
  rough consensus before implementation. Default to "disagree and commit" if blocked.
- **Triage:** issues labeled by `workstream-*`, `good first issue`, `help wanted`, `blocked`.
- **Releases:** semantic-version tags once Milestone M5 is reached; changelog generated from
  Conventional Commits.

---

## 10. Roadmap & Milestones

| Milestone | Scope | Workstreams |
|-----------|-------|-------------|
| **M0 — Community ready** | Contributor docs, templates, license, layout skeleton | G |
| **M1 — Local build** | App + Docker image builds/runs locally | A |
| **M2 — Cheap CI** | Quality + Build + Scan green with severity gate | B, C |
| **M3 — Full CI** | Compose + integration + ZAP + publish green | D, E, F (CI part) |
| **M4 — CD** | Deploy + smoke + notify to staging | F (CD part) |
| **M5 — Template GA** | Meta-CI, multi-language presets, GitHub Template enabled | H, I |

M0 and M1 can proceed in parallel from day one.

---

## 11. Good First Issues

Great starting points for new contributors (Workstreams **G** and **A/B**):

- Draft `CONTRIBUTING.md` from Section 7.
- Add issue templates (bug, feature, workstream task) and a PR template.
- Write `scripts/wait-for-healthy.sh` with `shellcheck`-clean output.
- Create the `.dockerignore` and a minimal `/health` endpoint for the sample app.
- Add a `yamllint` config and lint existing YAML.
- Write the README "Adopt this template in 4 steps" section.

> Don't see your idea here? Open an issue and tag the relevant workstream — proposals welcome.
