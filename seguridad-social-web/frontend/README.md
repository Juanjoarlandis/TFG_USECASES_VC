# Social Security Web – Front‑End

> **Status:** Proof‑of‑concept – not an official government service.  
> **Stack:** React 18 • Redux Toolkit • TailwindCSS • Walt.id VC flows • Docker multi‑stage

---

## Table of Contents
1. [Project Purpose](#project-purpose)  
2. [Main Features](#main-features)  
3. [Technology Stack](#technology-stack)  
4. [Folder Layout](#folder-layout)  
5. [Prerequisites](#prerequisites)  
6. [Local Installation](#local-installation)  
7. [Environment Variables](#environment-variables)  
8. [NPM Scripts](#npm-scripts)  
9. [Testing & Coverage](#testing--coverage)  
10. [Docker Usage](#docker-usage)  
11. [Internationalisation](#internationalisation)  
12. [Accessibility](#accessibility)  
13. [Security Notes](#security-notes)  
14. [Troubleshooting FAQ](#troubleshooting-faq)  
15. [Contributing](#contributing)  
16. [License](#license)

---

## Project Purpose
This single‑page application is the **public portal** used in the *Social Security* demo
ecosystem.  It enables citizens to:

* **Verify their identity** using Verifiable Credentials (VCs) issued to a Walt.id wallet.  
* **Obtain / revoke Social‑Security credentials** ( *Alta* and *Baja*).  
* **Consult personal information** such as contribution history or active benefits via
  an intuitive dashboard.

The repo demonstrates how modern web tooling, decentralised identity and container
orchestration can be combined to build secure e‑government services.

---

## Main Features
| Area | Highlights |
|------|------------|
| **Credential Flows** | • Wallet login (no QR)  • Manual QR verification  • 3‑credential verification with polling |
| **Issuance** | Automated issuance of the *Alta_Seguridad_Social* credential after successful verification |
| **Dashboard** | Personal profile, credentials viewer, contribution history, benefits, document downloads |
| **UX** | Tailwind 3.x design system, dark‑mode toggle, animations via Framer Motion & Anime.js |
| **i18n** | `react‑i18next` with English & Spanish resources – fully extensible |
| **State Management** | Redux Toolkit slice for auth / verification state (tokens stored in memory + localStorage fallback) |
| **Testing** | Jest + React‑Testing‑Library  • MSW for API mocking  • Cypress for E2E |
| **Dev Ops** | Multi‑stage Dockerfile, Nginx reverse‑proxy sample, GitHub‑friendly workflows |

---

## Technology Stack
| Layer | Libraries / Tools |
|-------|-------------------|
| UI | React 18, React‑Router 6, Framer‑Motion, Anime.js, React‑Icons, React‑Toastify |
| Styling | TailwindCSS 3, PostCSS, Autoprefixer |
| State | Redux Toolkit, React‑Redux |
| Data fetch | Axios (with custom instance & interceptors) |
| Forms / Validation | Zod schemas |
| Internationalisation | i18next, react‑i18next |
| Testing | Jest, Testing‑Library, MSW, Cypress, jest‑axe (a11y) |
| Tooling | Babel, ESLint, Prettier |
| Containerisation | Node 18 build stage → Node 16‑alpine runtime • Nginx TLS reverse proxy |

---

## Folder Layout
```
frontend/
├── public/            # Static assets served by CRA
├── src/
│   ├── pages/         # Top‑level routes (Home, Dashboard, Alta…)
│   ├── components/    # Reusable UI widgets (Header, Footer…)
│   ├── store/         # Redux Toolkit store & slices
│   ├── services/      # API wrappers that hit the backend
│   ├── utils/         # Helpers (validation, constants…)
│   ├── i18n.js        # i18next configuration
│   └── …              # Tests, mocks, CSS
├── certs/             # Self‑signed TLS certificates for local Nginx
├── Dockerfile         # Multi‑stage build / runtime image
├── nginx.conf         # Example reverse proxy for TLS + API gateway
└── README.md          # You are here
```

---

## Prerequisites
* **Node ≥ 18.17** & **npm ≥ 10**  
  (`nvm install 18 && nvm use 18` is recommended)  
* A running instance of the **backend** service exposed at `https://localhost/backend`.  
  > The gateway path can be re‑pointed via `REACT_APP_BACKEND_URL`.

---

## Local Installation
```bash
# clone & enter
git clone https://github.com/your‑org/social‑security‑web.git
cd social‑security‑web/frontend

# install deps
npm install

# start dev server
npm start
# => http://localhost:3000 (auto‑reload enabled)
```

---

## Environment Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `REACT_APP_BACKEND_URL` | Base URL for all API calls (must include `/backend` prefix) | `https://localhost/backend` |

Create a `.env` file in `/frontend` – *remember: CRA only injects vars prefixed with `REACT_APP_*`.*

---

## NPM Scripts
| Script | What it does |
|--------|--------------|
| `npm start` | Runs CRA dev server with hot reload |
| `npm run build` | Produces an optimised production bundle in `/build` |
| `npm test` | Executes Jest in watch mode |
| `npm run cypress` | Launches the Cypress UI runner |
| `npm run eject` | **Irreversible** – exposes CRA configuration |
| `npm run lint` | Lints the codebase (if you add ESLint) |

---

## Testing & Coverage
### Unit / Integration  
* **Jest** with React‑Testing‑Library (`jest.setup.js` mocks axios & i18next).  
* Sample slice tests in `src/store/*.test.js`.

### End‑to‑End  
* **Cypress 14** with `cypress-axe` for automated accessibility checks.

Run all tests:
```bash
npm test -- --watchAll=false && npx cypress run
```

---

## Docker Usage
Build a self‑contained image (static files served by `serve`):

```bash
# build
docker build -t ss‑web:latest .

# run
docker run -p 3000:3000 ss‑web:latest
```

### Full stack with Nginx reverse proxy  
The `nginx.conf` bundled at the repo root proxies:

* `/`               → `frontend:3000`  
* `/backend/**`     → `backend:3001`  
* `/wallet/**`      → `waltid-demo-wallet:7101`

Mount your TLS certificates under `/etc/nginx/certs` or generate dev certs with `mkcert`.

---

## Internationalisation
Translation resources live in `src/i18n.js`.  
Add a new language:

```js
resources.fr = { translation: { welcome: "Bienvenue", … } };
```

Switch language at runtime with:

```js
const { i18n } = useTranslation();
i18n.changeLanguage("fr");
```

---

## Accessibility
* Semantic HTML & **Tailwind** colour‑contrast utilities.  
* CI step with **jest‑axe** + Cypress‑axe to catch a11y regressions.  
* All interactive components are keyboard‑navigable and ARIA‑labelled.

---

## Security Notes
* JWT access & refresh tokens are kept in **memory** and mirrored to **localStorage**
  only for rehydration – mitigate XSS accordingly.
* TLS termination, CSP & HSTS are enforced by Nginx (sample config included).
* No secrets are baked into the front‑end image – everything is driven by env vars.

---

## Troubleshooting FAQ
| Symptom | Fix |
|---------|-----|
| _API 404 when running locally_ | Ensure `REACT_APP_BACKEND_URL` matches the backend container hostname & port inside Docker‑compose |
| _QR expires immediately_ | System clock mismatch – check that host & container clocks are in sync |
| _Dark‑mode toggle doesn’t work_ | The `dark` class is toggled on `<html>` – ensure Tailwind’s `darkMode:'class'` is present |

---

## Contributing
1. Fork the repo & create a feature branch  
2. Follow the existing ESLint/Prettier rules (`npm run lint -- --fix`)  
3. Provide tests where applicable  
4. Open a pull request – we use **Conventional Commits** for commit messages

All constructive feedback is welcome 🎉

---

## License
[MIT](../LICENSE) © 2024 Social Security Demo – created for educational purposes only.