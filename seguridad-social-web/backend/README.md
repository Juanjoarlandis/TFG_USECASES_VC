[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]

# Verifier Backend

**Verifier Backend** is a production-grade Node.js + Express service driving the **verification**, **issuance** and **revocation** of **Verifiable Credentials (VCs)** for the Spanish *Seguridad Social* proof-of-concept. It acts as the *Verifier Coordinator* in an OpenID4VC flow, communicates with Walt.id **Wallet**, **Issuer** and **Verifier** micro-services, and persists session state in Redis and user data in MongoDB.

---

## Table of Contents

- [Key Features](#key-features)  
- [Technology Stack](#technology-stack)  
- [Project Layout](#project-layout)  
- [Getting Started](#getting-started)  
- [Configuration](#configuration)  
- [Testing](#testing)  
- [Docker & Docker Compose](#docker--docker-compose)  
- [Security & Hardening](#security--hardening)  
- [Contributing](#contributing)  
- [License](#license)  

---

## Key Features

- **Verification**  
  - OID4VC presentation requests (1-credential & 3-credential “Alta” flows)  
  - Direct-POST callbacks with signature, expiration & revocation checks  
  - Session state stored in Redis  

- **Issuance**  
  - JWT-VC “Alta” issuance via Walt.id Issuer API  
  - Single-click credential claim  

- **Revocation**  
  - JTI black-listing in MongoDB  
  - User status update and optional wallet deletion  

- **Authentication**  
  - Email + password login against Walt.id Wallet  
  - Fully automatic credential presentation (no QR)  
  - Access & refresh JWT issuance  

- **User Management**  
  - Personal data stored in MongoDB  
  - Field-level AES-256-GCM encryption (via `mongoose-encryption`)  

- **Observability**  
  - Structured logging with Winston (default `debug` level)  
  - Request-logging middleware  
  - Comprehensive unit, integration, contract & E2E testing  

---

## Technology Stack

- **Node.js 16** / **Express 4**  
- **MongoDB 6** via **Mongoose 8**  
- **Redis 7** (mocked in tests with `ioredis-mock`)  
- **JWT** authentication (`jsonwebtoken`)  
- **OpenID for Verifiable Presentations** (OID4VC)  
- **Walt.id** Wallet / Issuer / Verifier micro-services  
- **Jest**, **Supertest**, **Pact**, **Playwright** for testing  
- **Docker** & **Docker Compose** for environment orchestration  

> Exact package versions are pinned in `package.json`.  

---

## Project Layout

```
backend/
├── app.js                 # Express bootstrap (entry point)
├── Dockerfile
├── .env.example           # Template for secrets & runtime config
├── src/
│   ├── controllers/       # REST controllers (thin, pure I/O)
│   ├── services/          # Business logic (no Express concerns)
│   ├── models/            # Mongoose schemas (User, RevokedCredential…)
│   ├── routes/            # Express routers
│   ├── middleware/        # CORS, rate-limit, auth, error handlers
│   └── utils/             # Stateless helpers (JWT, validation, sessionStore)
├── tests/                 # unit, integration, contract & E2E tests
│   └── fixtures/          # sample JWTs & JSON responses
├── deploy/                # Docker Compose and deployment manifests
└── README.md              # ← You are here
```

---

## Getting Started

```bash
# 1) Clone the repo and enter backend
git clone https://github.com/your-org/seguridad-social-web.git
cd seguridad-social-web/backend

# 2) Install dependencies
npm ci

# 3) Launch MongoDB & Redis
docker compose up -d mongo-backend redis

# 4) Copy and configure environment variables
cp .env.example .env
# Edit `.env` with your values

# 5) Start the service
npm start
# → Health check: http://localhost:3001/health (returns `{ status: 'ok' }`)
```

---

## Configuration

Environment variables are loaded via **dotenv**. Below is a minimal set for local development:

| Category              | Variable                      | Example                                                  | Description                                           |
|-----------------------|-------------------------------|----------------------------------------------------------|-------------------------------------------------------|
| **Server**            | `PORT`                        | `3001`                                                   | HTTP port for Express                                 |
| **Database & Cache**  | `MONGO_URI`                   | `mongodb://mongo-backend:27017/seguridadSocial`          | MongoDB connection URI                                |
|                       | `REDIS_HOST` / `REDIS_PORT`   | `redis` / `6379`                                         | Redis connection parameters                           |
|                       | `REDIS_DB`                    | `0`                                                      | Redis database index                                  |
| **Walt.id Services**  | `WALTID_VERIFIER_URL`         | `http://caddy:7003`                                      | Walt.id Verifier gateway                              |
|                       | `WALTID_ISSUER_URL`           | `http://caddy:7002`                                      | Walt.id Issuer gateway                                |
|                       | `VERIFIER_COORD_PUBLIC_URL`   | `http://localhost:3001`                                  | Public base URL for callbacks                         |
| **JWT & Encryption**  | `JWT_SECRET`                  | (base64 string)                                          | Secret for signing access tokens                      |
|                       | `JWT_REFRESH_SECRET`          | (base64 string)                                          | Secret for signing refresh tokens                     |
|                       | `ENCRYPTION_KEY`              | (base64 32 bytes)                                        | AES key for `mongoose-encryption`                     |
|                       | `SIGNING_KEY`                 | (base64 64 bytes)                                        | HMAC key to sign encrypted fields                     |

> **IMPORTANT**: Never commit secrets. Use Docker secrets, Kubernetes Secrets, AWS SSM, Vault, or similar in production.

---

## Testing

```bash
# Linting & formatting
npm run lint
npm run format

# Unit, integration & contract tests
npm test

# E2E tests (Playwright)
npm run test:e2e
```

---

## Docker & Docker Compose

### Build & Run Standalone Image

```bash
docker build -t verifier-backend:latest .
docker run --env-file .env -p 3001:3001 verifier-backend:latest
```

### Complete Stack with Docker Compose

A full stack (MongoDB, Redis, Walt.id services, Caddy proxy, backend) is defined in `deploy/docker-compose.yaml` at the repository root:

```bash
docker compose -f deploy/docker-compose.yaml up -d
```

Or start only the backend layer:

```bash
docker compose up -d backend
```

Health check:

```bash
docker compose exec backend curl -s http://localhost:3001/health
```

---

## Security & Hardening

- **HTTPS** terminated by Caddy/Nginx (run behind a reverse proxy)  
- **CORS** locked down in production (`src/middleware/corsConfig.js`)  
- **Rate limiting**: 10 req/min on `/auth/*` endpoints  
- **Field-level encryption**: AES-256-GCM for sensitive fields (`nss`)  
- **JWT tokens**: access tokens expire in 15 min; refresh tokens in 7 days  
- **Secrets** must be rotated and managed via a secure secret store  
- **Logging**: default `debug` level; switch to `info` in production using `LOGGER_LEVEL`  

---

## Contributing

1. Fork the repository → `git checkout -b feat/your-feature`  
2. Keep commits focused & atomic  
3. Add or update tests as needed  
4. Open a Pull Request (PR template will guide you)  
5. One approval from the maintainers is required before merging  

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## License

Released under the **MIT License**. See [LICENSE](LICENSE) for full text.  