# Contributing

Thanks for your interest in improving the **Reusable CI/CD Pipeline Template**! This project is
built in the open and designed so multiple contributors can work in parallel. This guide explains
how to get from "I want to help" to a merged pull request.

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 1. Start here

1. Read the [implementation plan](./implementation-plan.md). Work is organized into **workstreams
   (A–I)** — self-contained units with clear acceptance criteria.
2. Skim open issues, especially those labeled **`good first issue`** and **`help wanted`**.
3. Have an idea that isn't tracked? Open an issue and tag the relevant workstream.

## 2. Claim a task

- Comment on the issue you want to work on so we can assign it to you (first-come basis).
- If no issue exists yet, open one using the **Workstream task** template before starting larger work.
- For significant or architectural changes, open a **Discussion / RFC issue** first to align before coding.

## 3. Set up your environment

You'll need:

- **Git**
- **Docker** and **Docker Compose**
- A POSIX shell for running `scripts/`
- Optional linters used in CI: `shellcheck`, `yamllint`

```bash
git clone https://github.com/OWNER/template-ci-cd.git
cd template-ci-cd
```

## 4. Branch & commit conventions

- **Branch name:** `workstream-<letter>/<short-description>`
  (e.g. `workstream-c/trivy-gate`).
- **Commits:** follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` new capability
  - `fix:` bug fix
  - `docs:` documentation only
  - `ci:` pipeline/workflow changes
  - `chore:` tooling/maintenance
  - `refactor:` / `test:` as appropriate

## 5. Make your change

- Keep PRs **small and focused** — one logical change per PR.
- Put non-trivial logic in `scripts/` so it can be tested locally (workflows just call scripts).
- **No secrets** in the repo. Use GitHub Actions secrets / OIDC and document any new secret in the README.
- Make every pipeline stage **toggleable** via `pipeline.config.yml` where relevant.
- Update docs (README / implementation plan) in the **same PR** when behavior changes.

### Style

- **Shell:** start scripts with `set -euo pipefail`; keep them `shellcheck`-clean.
- **YAML:** 2-space indent; keep it `yamllint`-clean.

## 6. Open a pull request

1. Push your branch and open a **draft PR early** so others can see direction.
2. Fill out the PR template and link the issue (e.g. `Closes #123`).
3. Ensure checks pass (once meta-CI exists) and request review.
4. Address feedback; we use **squash merge** with a Conventional Commit title.

### PR checklist

- [ ] Linked to an issue / workstream
- [ ] Focused, single-purpose change
- [ ] Docs updated if behavior changed
- [ ] No secrets committed
- [ ] Lints pass (`shellcheck`, `yamllint`) where applicable

## 7. Review & merge

- At least **one maintainer approval** is required to merge.
- Maintainers own areas via [`CODEOWNERS`](./.github/CODEOWNERS).
- If consensus stalls on a design question, we default to **"disagree and commit"** after discussion.

---

## Reporting bugs & requesting features

Use the issue templates:

- **Bug report** — steps to reproduce, expected vs. actual, environment.
- **Feature request** — problem, proposed solution, alternatives.
- **Workstream task** — a unit of work tied to a workstream in the implementation plan.

## Security issues

Please **do not** open public issues for security vulnerabilities. Report them privately to the
maintainers (see `SECURITY.md` once available, or contact a maintainer directly).

## License

By contributing, you agree that your contributions will be licensed under the
[Apache License 2.0](./LICENSE), consistent with the rest of the project.
