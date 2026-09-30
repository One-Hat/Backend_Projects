# 🚀 Backend Projects Portfolio

[![Backend Projects CI](https://github.com/One-Hat/Backend_Projects/actions/workflows/ci.yml/badge.svg)](https://github.com/One-Hat/Backend_Projects/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20+-68a063?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GraphQL](https://img.shields.io/badge/GraphQL-Yoga-e10098?logo=graphql&logoColor=white)](https://the-guild.dev/graphql/yoga-server)
[![Prisma](https://img.shields.io/badge/Prisma-6.4+-2d3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A collection of production-grade backend engineering projects exploring database schema design, runtime validation, GraphQL API architecture, caching, N+1 query elimination, role-based access control (RBAC), and asset delivery pipelines.

---

## 📂 Projects Overview

| # | Project | Primary Tech Stack | Core Architectural Focus | Documentation |
|---|:---|:---|:---|:---|
| **01** | **[Full-Stack URL Shortener](./project-1-url-shortener)** | Node.js, Express, React (Vite), Zod, CORS | URL hashing, in-memory caching, 302 redirections, analytics | [Project 1 Docs](./project-1-url-shortener/README.md) • [OpenAPI](./project-1-url-shortener/openapi.json) |
| **02** | **[Custom Headless CMS](./project-2-headless-cms)** | TypeScript, Fastify, GraphQL Yoga, Prisma, PostgreSQL 16 | Dynamic content modeling, DataLoader (zero N+1), RBAC, Media streaming | [Project 2 Docs](./project-2-headless-cms/README.md) • [Interactive Deck](./project-2-headless-cms/presentation/README.md) |

---

## 🏛️ Project Highlights

### 🔗 Project 1: Full-Stack URL Shortener
- **Deterministic Validation**: Zod middleware inspects request payloads with fail-fast HTTP 400 rejection on malformed inputs.
- **High-Throughput Redirection**: Generates collision-resistant base64url 6-character aliases with instant HTTP 302 redirects.
- **Telemetry**: Records click metrics and timestamps per alias.
- **Specification**: Includes ready-to-import [OpenAPI 3.0 Specification](./project-1-url-shortener/openapi.json).

### ⚡ Project 2: Custom Headless CMS Backend with GraphQL & TypeScript
- **Dynamic Content Modeling**: Runtime definition of content types (`Blog Post`, `Author`, `Category`, `Product`) backed by PostgreSQL `JsonB` and dynamic relation junction tables (`EntryRelation`).
- **N+1 Query Elimination**: Custom **DataLoader** engine batching and caching relational lookups within the Node.js event loop tick, reducing 21 queries down to 2.
- **Dual-Vector Authentication & RBAC**:
  - `JWT` Bearer tokens for interactive Admin/Editor management dashboards.
  - `x-api-key` tokens for decoupled consumer frontend applications (Next.js, Astro, Remix, mobile).
- **Interactive Presentation Deck**: Built with **React.js & Tailwind CSS** featuring an obsidian grey & hot pink design palette and 3-mode 3D page turning (Left, Top, and Live 3D).
- **Tooling**: Includes [GraphQL Query Catalog](./project-2-headless-cms/graphql/queries.graphql), [Postman Collection](./project-2-headless-cms/postman_collection.json), and Docker container configs.

---

## 🚀 Repository Quickstart

### 1. Run Project 1 (URL Shortener)
```bash
# Start backend
cd project-1-url-shortener/url-shortener
npm install
npm start

# In another terminal, run tests
npm test
```

### 2. Run Project 2 (Headless CMS)
```bash
cd project-2-headless-cms

# 1. Install & sync database
npm install
npm run prisma:push
npm run seed

# 2. Start server
npm run dev

# 3. Explore GraphiQL IDE
# Visit: http://localhost:4000/graphql
```

### 3. Run the React + Tailwind Presentation Deck
```bash
cd project-2-headless-cms/presentation
npm install
npm run dev
# Visit: http://localhost:5173
```
