# 🖥️ Headless CMS Interactive Presentation (React.js + Tailwind CSS)

An interactive, animated presentation web application built with **React.js, Tailwind CSS, Vite, and Lucide Icons**.

---

## 🎨 Theme & Features
- **Grey & Pink Theme**: Dark charcoal & slate foundation with glowing neon pink accents (`#ff2d75`).
- **3 Directional Page-Turn Modes**:
  - 👈 **Left Turn**: 3D horizontal book-style page turn.
  - 👆 **Top Flip**: 3D vertical drop flip down from the top.
  - ⚡ **Live 3D**: Dynamic perspective depth fold with live state transitions.
- **Interactive Demos**:
  - Live Dynamic Schema Builder (add fields dynamically and watch simulated PostgreSQL `JsonB` update in real time).
  - DataLoader Benchmark Comparison (Without DataLoader vs With DataLoader).
  - Live RBAC Role Switcher (`ADMIN`, `EDITOR`, `CONSUMER`).
  - Automated E2E Test Scoreboard.
  - Web Audio API synthesizer for sci-fi clicks and transition audio.
  - Keyboard navigation (arrows/space), slide counter, and fullscreen mode (`F`).

---

## 🚀 How to Run Locally

### Development Mode (with Hot Reload)
```bash
npm install
npm run dev
```
Then open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```
