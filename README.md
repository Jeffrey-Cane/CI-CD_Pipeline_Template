# Reusable CI/CD Pipeline Template

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

A **drop-in CI/CD pipeline template** for backend projects (Node.js, Python, Java, Go, .NET, …).
Adopt the same battle-tested stages in any repo and change only project-specific details —
build commands, ports, and deployment target.

> This is a community-built, open-source project. Contributions are welcome — see
> [CONTRIBUTING.md](./CONTRIBUTING.md) and the [implementation plan](./implementation-plan.md).

---

## Why this exists

Most teams rebuild the same pipeline over and over. This template treats the pipeline as a
**product**: a stable set of stages you reuse everywhere, with all variability isolated to a
single config file.

## Pipeline at a glance

```
Git Push
   │
   ▼
CI  ── Lint ─▶ Unit Tests ─▶ Build ─▶ Docker Build ─▶ Trivy Scan
        ─▶ Compose Up ─▶ Integration Tests ─▶ ZAP (DAST) ─▶ Publish Image
   │
   ▼
CD  ── Deploy ─▶ Smoke Test ─▶ Health Check ─▶ Notify
```

The 10 stages and full design are documented in [`mockup_plan.md`](./mockup_plan.md).

## Features

- **Code quality:** lint, format check, static analysis, unit tests.
- **Container security:** Trivy image scan with HIGH/CRITICAL gate.
- **Runtime parity:** everything runs in Docker via `docker-compose.yml`.
- **Integration tests:** API, database, and auth tests against the running stack.
- **DAST:** OWASP ZAP autonomous scan (spider → passive → active → report).
- **Publish & deploy:** push to GHCR/Docker Hub/ACR, deploy to Compose/K8s/VPS/Cloud VM.
- **Smoke tests & notifications:** post-deploy checks and Slack/Email/Teams/Discord alerts.
- **One config surface:** edit `pipeline.config.yml`, not the workflows.

> Status: under active development. See the [roadmap](./implementation-plan.md#10-roadmap--milestones)
> for what's built and what's next.

---

## Adopt this template in 4 steps

1. **Copy the template.** Click *Use this template* on GitHub (or fork/clone the repo).
2. **Update `pipeline.config.yml`.** Set your app name, language, port, and commands.
3. **Adjust the `Dockerfile`** and `docker-compose.yml` service names/ports as needed.
4. **Push.** The pipeline runs the same stages with your project's details.

### Minimal configuration example

```yaml
# pipeline.config.yml
app:
  name: myapp
  language: node
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

deploy:
  target: compose
  environment: staging
```

---

## Repository layout

```
.
├── app/                  # Reference application (swap per project)
├── tests/                # unit/ and integration/
├── Dockerfile
├── docker-compose.yml
├── .github/workflows/    # ci.yml, deploy.yml
├── zap/zap.yaml          # ZAP automation plan
├── trivy/trivy.yaml      # Trivy config + severity gates
├── scripts/              # smoke-test.sh, wait-for-healthy.sh
├── pipeline.config.yml   # the only file you usually edit
└── reports/              # CI-generated artifacts (gitignored)
```

## Required secrets

Configure these as GitHub Actions secrets (names are conventions; see the workflows):

| Secret | Purpose |
|--------|---------|
| `REGISTRY_USERNAME` / `REGISTRY_TOKEN` | Push images to the container registry |
| `DEPLOY_KEY` / cloud creds | Deploy to your target environment |
| `NOTIFY_WEBHOOK` | Slack/Teams/Discord notifications |

Never commit secrets. Prefer OIDC where supported.

---

## Contributing

We'd love your help. Good entry points:

- Read the [implementation plan](./implementation-plan.md) — work is organized into
  **claimable workstreams (A–I)**.
- Browse issues labeled `good first issue` and `help wanted`.
- Follow [CONTRIBUTING.md](./CONTRIBUTING.md) and our [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

Licensed under the [Apache License 2.0](./LICENSE). See [NOTICE](./NOTICE) for attribution.
