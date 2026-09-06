# 🔗 Full-Stack URL Shortener

A lightweight, full-stack URL shortening service built with a Node.js/Express backend and a React (Vite) frontend. The project implements runtime schema validation, in-memory data caching, analytics tracking, and cross-origin communication.

---

## 🏗️ Architecture & Project Structure

The repository is structured as a monorepo containing both the backend service and the client application:

```text
.
├── .gitignore
├── README.md
├── client/              # Frontend React application (Vite)
│   ├── src/
│   │   ├── App.jsx      # Core UI component & API fetch handlers
│   │   └── main.jsx
│   └── package.json
└── url-shortener/       # Backend REST API (Express + CJS)
    ├── index.js         # Server, routes, validation middleware, and data store
    └── package.json
⚡ Tech Stack
Backend: Node.js, Express, CommonJS (require)

Validation: Zod (runtime request schema enforcement)

Utilities: Node.js native crypto (secure random byte generation)

Frontend: React 18, Vite

Networking: Fetch API, CORS middleware

🚀 Features
Link Shortening: Accepts target URLs and returns base64url-encoded 6-character aliases.

Fail-Fast Validation: Zod middleware inspects request payloads and returns detailed error maps on malformed input (HTTP 400).

HTTP 302 Redirections: Direct browser redirection from short link paths (/:code) to destination addresses.

Click Analytics: Records and exposes total click volume and timestamps per generated alias.

Reactive UI: Instant feedback for errors, clickable short link previews, and dedicated stats inspection panels.
📌 Planned Enhancements
[ ] Replace the in-memory Map with persistent storage using SQLite (better-sqlite3).

[ ] Add rate limiting via express-rate-limit to prevent denial-of-service abuse.

[ ] Implement custom user-defined alias support.

[ ] Refactor backend structure into standard MVC layers (Controllers, Services, Models).

