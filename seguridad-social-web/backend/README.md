
# Verifier Backend

**Verifier Backend** is a production‑grade Node.js + Express service that drives the **verification, issuance and revocation** of **Verifiable Credentials (VCs)** for the Spanish *Seguridad Social* (Social Security) proof‑of‑concept.  
It acts as the *Verifier Coordinator* in an OpenID4VC flow, talks to the Walt.id **Wallet**, **Issuer** and **Verifier** micro‑services, and keeps user / session state in MongoDB & Redis.

---

## Table of Contents
1. [Key Features](#key-features)  
2. [Technology Stack](#technology-stack)  
3. [Project Layout](#project-layout)  
4. [Getting Started](#getting-started)  
5. [Configuration](#configuration)  
6. [Running the Test‑Suite](#running-the-test-suite)  
7. [Docker & Docker Compose](#docker--docker-compose)  
8. [Security & Hardening](#security--hardening)  
9. [Contributing](#contributing)  
10. [License](#license)

---

## Key Features

| Domain | What it does |
| ------ | ------------ |
| **Verification** | Generates OID4VC presentation requests (1‑credential flows & 3‑credential “Alta” flows), receives direct‑post callbacks, validates signatures, expiration and *revocation status* and stores the session in Redis. |
| **Issuance** | Issues a JWT‑VC “Alta” (Social‑Security registration credential) via Walt.id *Issuer API* and lets the holder claim it with a single click. |
| **Revocation** | Black‑lists a credential by JTI in MongoDB, flips it to *revoked* on the user object, and (optionally) deletes the credential from the holder’s wallet. |
| **Authentication** | Email + password login directly against Walt.id **Wallet**, fully automatic credential presentation (no QR). Issues access / refresh JWTs for your front‑end. |
| **User Management** | Stores personal data in MongoDB with **field‑level AES‑256 encryption** (using `mongoose‑encryption`). |
| **Observability** | Structured logs with **Winston** (level `debug` by default), request logging middleware, integration & contract tests, E2E Playwright scenario. |

---

## Technology Stack

* **Node 16** / **Express 4**
* **MongoDB 6** via **Mongoose 8**
* **Redis 7** (mocked in tests with `ioredis‑mock`)
* **JWT** authentication (`jsonwebtoken`)
* **OpenID for Verifiable Presentations** (OID4VC)
* **Walt.id** Wallet / Issuer / Verifier services
* **Jest**, **Supertest**, **Pact**, **Playwright** for testing
* **Docker** & **Docker Compose** for reproducible environments

> The exact package versions are locked in `package.json`.

---

## Project Layout

```
backend/
├── app.js                 # Express bootstrap (single entry‑point)
├── Dockerfile
├── .env.example           # template for secrets & runtime config
├── src/
│   ├── controllers/       # REST controllers – thin, pure IO
│   ├── services/          # Business logic – no Express concerns
│   ├── models/            # Mongoose schemas (`User`, `RevokedCredential`)
│   ├── routes/            # Express routers, grouped by domain
│   ├── middleware/        # CORS, rate‑limit, auth & error handlers
│   └── utils/             # Stateless helpers (JWT, validation, …)
├── tests/                 # unit, integration, contract & E2E tests
│   └── fixtures/ …        # sample JWTs & JSON responses
└── README.md              # you are here 🚀
```

---

## Getting Started

```bash
# 1) clone the mono‑repo and go to backend
git clone https://github.com/your‑org/seguridad-social-web.git
cd seguridad-social-web/backend

# 2) install dependencies
npm ci         # or `npm install`

# 3) spin up Mongo & Redis (Docker)
docker compose up -d mongo-backend redis

# 4) copy env template and adjust values
cp .env.example .env
vi .env

# 5) run the service
npm start
# → http://localhost:3001/health   (JSON OK)
```

---

## Configuration

Environment variables are loaded with **dotenv**.  
Below is the minimal set for local development:

| Variable | Example | Description |
| -------- | ------- | ----------- |
| `PORT` | `3001` | Express HTTP port |
| `MONGO_URI` | `mongodb://mongo-backend:27017/seguridadSocial` | Mongo connection URI |
| `REDIS_HOST / PORT / DB` | `redis / 6379 / 0` | Redis connection |
| `WALTID_VERIFIER_URL` | `http://caddy:7003` | Walt.id Verifier gateway |
| `WALTID_ISSUER_URL` | `http://caddy:7002` | Walt.id Issuer gateway |
| `VERIFIER_COORD_PUBLIC_URL` | `http://localhost:3001` | Public callback base that Walt.id will call |
| `JWT_SECRET` | _(base64)_ | access‑token secret |
| `JWT_REFRESH_SECRET` | _(base64)_ | refresh‑token secret |
| `ENCRYPTION_KEY` | _(base64 32 bytes)_ | AES‑key for `mongoose‑encryption` |
| `SIGNING_KEY` | _(base64 64 bytes)_ | HMAC key to sign the ciphertext |

> **Secrets** should never be committed. Use Docker secrets, Kubernetes
> `Secrets`, AWS SSM, Vault, or any secret manager for production.

---

## Running the Test‑Suite

```bash
# lint & prettier
npm run lint      # eslint
npm run format    # prettier --write

# unit + integration + contract
npm test

# Playwright E2E (needs front‑end running)
npm run test:e2e
```

Coverage thresholds (80 %) are enforced via Jest.

---

## Docker & Docker Compose

### Build standalone image

```bash
docker build -t verifier-backend:latest .
docker run --env-file .env -p 3001:3001 verifier-backend:latest
```

### Complete stack

A full Compose file that wires **MongoDB**, **Redis**, Walt.id micro‑services,
Caddy reverse proxy and the **verifier-backend** lives at
`deploy/docker-compose.yaml` (see repository root).

Start only the backend layer:

```bash
docker compose up -d backend
```

Health‑check: `docker compose exec backend curl -s http://localhost:3001/health`.

---

## Security & Hardening

* **HTTPS** is terminated by Caddy / Nginx (backend runs behind a proxy).
* CORS is locked down in production (`src/middleware/corsConfig.js`).
* Rate‑limit of **10 req/min** on `/auth/*` endpoints.
* Sensitive Mongo fields (`nss`) are AES‑256‑GCM encrypted at rest.
* JWT access tokens expire after **15 min**, refresh tokens after **7 days**.
* Secrets **must** be rotated & mounted via secret management in production.
* Logs default to `debug` – switch to `info` in prod (`LOGGER_LEVEL`).

---

## Contributing

1. Fork ➜ `git checkout -b feat/<name>`  
2. Keep commits small & atomic.  
3. Add/adjust unit tests – CI must stay green.  
4. Open a Pull‑Request – template will guide you.  
5. One approving review from the maintainers team is required.

---

## License

Released under the **MIT License** – see `LICENSE` file for full text.

