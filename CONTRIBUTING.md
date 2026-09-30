# Contributing to Backend Projects

Thank you for your interest in contributing! This repository showcases production-grade backend architectures, ranging from RESTful microservices to dynamic GraphQL headless content engines.

---

## 🛠️ Development Guidelines

1. **Monorepo Structure**: Keep project dependencies scoped to their respective directory (`project-1-url-shortener/` or `project-2-headless-cms/`).
2. **Code Quality**: Ensure all TypeScript files pass `npx tsc --noEmit` and existing test suites succeed (`npm test` / `npm run test:e2e`).
3. **Commit Messages**: Follow Conventional Commits:
   - `feat(scope): ...` for new features
   - `fix(scope): ...` for bug fixes
   - `docs(scope): ...` for documentation
   - `ci(scope): ...` for workflows and build pipelines

---

## 🧪 Submitting Changes

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes and push to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
3. Open a Pull Request referencing any relevant issues or design decisions.
