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
