# Friday-e Demo Frontend

Simple React + TypeScript app (Vite) to collect websites and subjects, call the backend agent, and render results.

Scripts:

- dev: start Vite dev server with proxy to the backend
- build: type-check and build to `../backend/static`
- preview: preview the production build

Env:

- VITE_API_BASE (optional): backend base URL used by the dev proxy and direct fetches. Default: `http://localhost:8000` (proxy) and `/api` in the browser.

Notes:

- The frontend fetches via `/api` at runtime; Vite dev server proxies to `VITE_API_BASE`.
- Minimal CSS and small reusable component keep code easy to read and change.
