# 🚀 Backend Projects Portfolio

A collection of production-grade backend engineering projects exploring database modeling, API architecture, authentication, caching, and delivery systems.

---

## 📂 Projects

### [1. Full-Stack URL Shortener (Project 1)](./project-1-url-shortener)
- **Tech Stack**: Node.js, Express, React (Vite), Zod, CORS
- **Core Concepts**: URL hashing, redirect mechanics, REST API design, lightweight client frontend, click analytics.
- **Interactive Presentation Deck**: [Open Project 1 Presentation](./project-1-url-shortener/presentation/index.html)
- **Documentation**: [Project 1 README](./project-1-url-shortener/README.md)

### [2. Custom Headless CMS Backend with GraphQL & TypeScript (Project 2)](./project-2-headless-cms)
- **Tech Stack**: Node.js, TypeScript, Fastify, GraphQL Yoga, Prisma ORM, PostgreSQL 16
- **Core Concepts**:
  - **Dynamic Content Modeling**: Runtime content types and dynamic schemas backed by PostgreSQL `JsonB` with relational integrity.
  - **GraphQL Delivery Layer**: Dynamic schema resolvers and **DataLoader** engine to eliminate N+1 database queries.
  - **Security & RBAC**: Dual-vector authentication with JWT (Admin/Editor) and scoped API Keys (Consumer clients).
  - **Media Management**: Multipart asset upload pipeline and static asset serving.
  - **Containerization**: Turnkey `docker-compose.yml` and multi-stage `Dockerfile`.
- **Interactive Presentation Deck**: [Open Project 2 Presentation](./project-2-headless-cms/presentation/index.html) *(Features animated grey & pink theme with Left, Top, and Live 3D page turn modes)*
- **Documentation**: [Project 2 README](./project-2-headless-cms/README.md)
