# Pipeline Design

This document describes **what we are building**: a reusable CI/CD template for backend
projects (Node.js, Python, Java, Go, .NET, etc.).

The pipeline is a fixed set of stages. Each project only changes its own details — build
commands, ports, registry, and deploy target — via `pipeline.config.yml`.

For how to build and contribute, see [implementation-plan.md](./implementation-plan.md).

---

## End-to-end flow

```
Developer push
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│  CI (ci.yml)                                            │
│  quality → build → scan → compose → integration → zap   │
│  → publish image                                        │
└─────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│  CD (deploy.yml)                                        │
│  deploy → smoke test → health check → notify            │
└─────────────────────────────────────────────────────────┘
```

---

## Pipeline stages

| # | Stage | What it does | Default gate |
|---|-------|--------------|--------------|
| 1 | Code quality | Lint, format check, static analysis, unit tests | Fail on error |
| 2 | Build | Compile/package and build Docker image | Fail on error |
| 3 | Container scan | Trivy scan of the image | Fail on HIGH/CRITICAL |
| 4 | Run app | Start stack with `docker compose up` | Fail if unhealthy |
| 5 | Integration tests | API, database, and auth tests against running app | Fail on error |
| 6 | DAST (ZAP) | Spider, passive scan, active scan, reports | Warn (configurable) |
| 7 | Publish | Push image to registry (GHCR, Docker Hub, ACR) | Only if CI passes |
| 8 | Deploy | Pull image and deploy to target environment | Fail on error |
| 9 | Smoke test | Check `/`, `/health`, and key auth flows | Fail on error |
| 10 | Notify | Send build, test, scan, and deploy summary | — |

Stages should be **toggleable** in `pipeline.config.yml` so lean projects can skip optional steps.

---

## Repository layout

```
.
├── app/                    # Reference app (replace per project)
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── pipeline.config.yml     # Project-specific settings
├── .github/workflows/
│   ├── ci.yml              # Stages 1–7
│   └── deploy.yml          # Stages 8–10
├── zap/zap.yaml            # ZAP automation plan
├── trivy/trivy.yaml        # Scan config and severity rules
├── scripts/                # smoke-test.sh, wait-for-healthy.sh
└── reports/                # CI artifacts (gitignored)
```

---

## Docker Compose stack

All services run on a shared internal network. Tests and scans talk to the app without
exposing ports publicly.

```
  app ── postgres
   │
   ├── redis
   ├── zap
   └── integration (test runner)
```

---

## Configuration

One file per project. Workflows read from here instead of hard-coding commands.

```yaml
# pipeline.config.yml (example)
app:
  name: myapp
  port: 8080
  health_path: /health

commands:
  install: npm ci
  lint: npm run lint
  unit_test: npm test
  build: npm run build

docker:
  image: ghcr.io/OWNER/myapp

scan:
  trivy_fail_on: HIGH,CRITICAL
  zap_target: http://app:8080

deploy:
  target: compose
  environment: staging
```

---

## Using vs. contributing

**Adopters** copy the template, edit `pipeline.config.yml` and the Dockerfile, then push.

**Contributors** improve shared stages, configs, and docs so every adopter benefits. Pick a
workstream in [implementation-plan.md](./implementation-plan.md) and open or claim an issue
before starting.

---

## Open decisions

Track these in GitHub issues or Discussions:

- Default registry (GHCR vs Docker Hub vs ACR)
- Which languages get a preset first
- Whether ZAP should fail the build by default or only warn
- Deploy targets to support out of the box (Compose, K8s, VPS)
