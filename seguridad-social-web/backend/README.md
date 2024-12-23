# Verifier Backend

This **Verifier Backend** is a Node.js/Express application that facilitates the verification of **Verifiable Credentials** (VCs) in a **Social Security** context. It also provides credential issuance, revocation, and user management functionalities. The project communicates with a **Wallet** (for example, a walt.id wallet or similar) and an **Issuer** API to complete credential-oriented flows such as:

1. **Credential Verification**: Receiving offers for proof requests (OID4VC flows) and validating them.
2. **Credential Issuance**: Issuing JWT-based credentials and sending them to a holder’s wallet.
3. **Credential Revocation**: Marking credentials as revoked so that they become invalid for future verifications.
4. **User Management**: Registering and updating user data (with sensitive fields encrypted in the database).
5. **Authentication**: Generating and refreshing JWT access and refresh tokens for user sessions.

Below is a detailed overview of how to set up, run, and develop this project.

---

## Table of Contents

1. [Key Features](#key-features)  
2. [Technologies and Dependencies](#technologies-and-dependencies)  
3. [Project Structure](#project-structure)  
4. [Installation](#installation)  
5. [Configuration](#configuration)  
6. [Usage](#usage)  
7. [Docker Support](#docker-support)  
8. [Security Considerations](#security-considerations)  
9. [Contributing](#contributing)  
10. [License](#license)

---

## Key Features

- **Verification of Verifiable Credentials**  
  Uses an **OID4VC** flow to receive verification requests, decode and validate the credentials provided by the holder, and determine whether they are valid and not revoked.

- **Issuance of Verifiable Credentials**  
  Generates and sends credential offers (in JWT format) to the holder’s wallet. Includes callback endpoints to track issuance status.

- **Credential Revocation**  
  Maintains a local revocation list (via a MongoDB collection) for revoked credentials. A revoked credential will fail subsequent verifications.

- **User Management**  
  Stores user data (including personal information) in MongoDB, encrypting sensitive fields (e.g., `nss`) with **mongoose-encryption**. Provides a REST endpoint to retrieve user information by a national ID (DNI).

- **Authentication**  
  Implements an authentication flow with **JWT** (access tokens and refresh tokens). Allows refreshing tokens, invalidating old tokens, and checking user sessions.

- **Logging**  
  Uses **Winston** (`logger.js`) for structured logging with custom formatting, allowing different log levels (debug, info, etc.).

---

## Technologies and Dependencies

Key dependencies (versions may vary, see `package.json` for the exact versions):

- [**Node.js**](https://nodejs.org/) (16+)
- [**Express**](https://expressjs.com/)
- [**Mongoose**](https://mongoosejs.com/) (MongoDB ORM)
- [**mongoose-encryption**](https://github.com/joegoldbeck/mongoose-encryption) for field-level encryption
- [**jsonwebtoken**](https://www.npmjs.com/package/jsonwebtoken) for JWT token generation and verification
- [**dotenv**](https://github.com/motdotla/dotenv) for loading environment variables
- [**axios**](https://axios-http.com/)
- [**uuid**](https://www.npmjs.com/package/uuid) for unique state IDs
- [**winston**](https://www.npmjs.com/package/winston) for logging
- [**cors**](https://www.npmjs.com/package/cors) for Cross-Origin Resource Sharing

---

## Project Structure

A brief overview of the directory layout:

```
backend/
├── app.js                 # Main entry point (Express server configuration)
├── package.json           # Project metadata and scripts
├── Dockerfile             # Docker build configuration
├── .env                   # Environment variables (should be kept secret)
├── src/
│   ├── controllers/       # Controllers containing request/response logic
│   ├── middleware/        # Express middlewares (e.g., error handling, CORS, logging)
│   ├── models/            # Mongoose schema definitions
│   ├── routes/            # Route definitions, mapping endpoints to controllers
│   ├── services/          # Reusable services for business logic (API calls, sessions, etc.)
│   └── utils/             # Utility functions (JWT, validations, session store, etc.)
├── logger.js              # Winston logger configuration
├── signing_key_base64.txt # Example file containing a signing key
├── encryption_key_base64.txt
└── README.md              # Project documentation
```

Key folders and files:

- **`app.js`**: Orchestrates database connection, middleware, route registration, and starts the Express server.  
- **`src/routes/`**: Organizes routes by domain (e.g., `authRoutes.js`, `issuanceRoutes.js`, `verificationRoutes.js`).  
- **`src/controllers/`**: Contains the logic for each route endpoint, calling on services as needed.  
- **`src/services/`**: Implements business logic that can be reused (e.g., handling wallet sessions, presenting credentials, verifying tokens).  
- **`src/models/`**: Mongoose data models (e.g. `User.js`, `RevokedCredential.js`).  
- **`logger.js`**: Configures Winston to output timestamps, levels, etc.  
- **`Dockerfile`**: Docker instructions to build and run this project inside a container.

---

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-repository/verifier-backend.git
   cd verifier-backend/backend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Ensure MongoDB is Running**

   You can run a local MongoDB instance or use Docker. For example, to run MongoDB locally with Docker:

   ```bash
   docker run -d --name mongo-backend -p 27017:27017 mongo:4.0
   ```

4. **Set Up Environment Variables**

   Create a `.env` file in the `backend` folder (or rename the provided example) to configure:

   ```bash
   WALTID_VERIFIER_URL=http://verifier-api:7003
   WALTID_ISSUER_URL=http://issuer-api:7002
   VERIFIER_COORD_PUBLIC_URL=http://backend:3001
   MONGO_URI=mongodb://mongo-backend:27017/seguridadSocial
   PORT=3001
   ISS_COORD_URL=http://issuer_coord:5500
   NODE_ENV=production
   WALLET_COORD_URL=http://caddy:7001
   JWT_SECRET='your-jwt-secret'
   JWT_REFRESH_SECRET='your-refresh-jwt-secret'
   ENCRYPTION_KEY='your-encryption-key'
   SIGNING_KEY='your-signing-key'
   CREDENTIAL_CONFIGURATION_ID=CustomIdentityCredential_jwt_vc_json
   ```

   - Make sure the above values match your environment (e.g., container names, ports).
   - Keep this file **out of version control** for security reasons.

5. **Start the Server**

   ```bash
   npm start
   ```

   The application listens on port `3001` by default (or as specified in `.env`).

---

## Configuration

- **`PORT`**: Defines the port on which the server listens (default `3001`).  
- **`MONGO_URI`**: Connection string for the MongoDB instance.  
- **`JWT_SECRET`** & **`JWT_REFRESH_SECRET`**: Secrets used to sign and verify JWT access and refresh tokens.  
- **`ENCRYPTION_KEY`** & **`SIGNING_KEY`**: Used by `mongoose-encryption` to encrypt certain fields in MongoDB and sign the encrypted data.  
- **`WALTID_VERIFIER_URL`** & **`WALTID_ISSUER_URL`**: Used for external OID4VC flows.  
- **`WALLET_COORD_URL`**: URL of the Wallet Coordinator service to communicate with a holder’s wallet (e.g., walt.id).  

Adjust these variables in the `.env` file to suit your environment.

---

## Usage

Once the server is up, it exposes several REST endpoints:

### 1. Verification Routes

- **POST `/verification/offer`**  
  Creates a verification offer (OID4VC) for a single credential type.

- **POST `/verification/offer3creds`**  
  Creates a verification offer requesting exactly three credentials.  
  Used for more complex flows (e.g., checking an Identity, a Passport, and an Employer registration credential).

- **POST `/verification/statusCallback/:stateId`**  
  Callback invoked by the walt.id Verifier service upon completion of a verification. Stores results in memory sessions.

- **GET `/verification/session/:stateId`**  
  Fetches the status of the verification session. Returns `verified`, `failed`, `expired`, or `pending`, along with any user data or tokens.

### 2. Issuance Routes

- **POST `/issuance/offerIssuance`**  
  Creates a credential issuance offer, usually after a successful verification.

- **POST `/issuance/statusCallback/:stateId`**  
  Callback invoked after the issuance flow completes on the Issuer side.

- **GET `/issuance/session/:stateId`**  
  Retrieves the current issuance session status (`offered`, `accepted`, `claimed`, etc.).

- **POST `/issuance/claimAltaCredential`**  
  Claims and stores the credential in the holder’s wallet.

### 3. User Management

- **GET `/user/:dni`**  
  Retrieves user data (first name, family name, birth date, etc.) by document number (DNI).

### 4. Credential Revocation

- **POST `/revocar/credencial`**  
  Revokes a credential by marking it in a MongoDB `RevokedCredential` collection and (optionally) deleting it from the holder’s wallet.

### 5. Authentication

- **POST `/auth/wallet-login`**  
  Logs in to the user’s wallet (with email/password) and attempts an automatic verification flow for an identity credential.

- **POST `/auth/refresh`**  
  Exchanges a valid refresh token for new access and refresh tokens.

---

## Docker Support

A basic Docker setup is included:

1. **Build the Image**

   ```bash
   docker build -t verifier-backend .
   ```

2. **Run the Container**

   ```bash
   docker run -p 3001:3001 --env-file .env verifier-backend
   ```

   This will start the container, exposing port **3001**. Environment variables will be loaded from the specified `.env` file.

**Note**: Make sure you have MongoDB accessible from inside the container, or link it with Docker Compose so that `MONGO_URI` points to a valid host.

---

## Security Considerations

1. **Environment Variables**  
   Never commit secrets (JWT keys, encryption keys, etc.) to version control. Keep `.env` files secure or use a secret manager (e.g., HashiCorp Vault, AWS Parameter Store).

2. **Field-Level Encryption**  
   Sensitive data (`nss`) is encrypted in MongoDB via **mongoose-encryption**. Evaluate whether additional fields (e.g., `birthDate`, `documentNumber`, etc.) also need encryption for compliance with local regulations (GDPR, etc.).

3. **JWT Handling**  
   - Access tokens expire relatively quickly (default 15 minutes in `jwtUtils.js`), and refresh tokens last 7 days.  
   - Validate tokens on protected routes if you expand functionality.  
   - Properly store and rotate refresh tokens in the database to invalidate them if needed.

4. **Logging**  
   - Winston is set to `level: 'debug'` by default. In production, consider changing to `'info'` or `'warn'`.  
   - Avoid logging sensitive info (tokens, personal data) at high detail in production.

5. **CORS**  
   - The `corsConfig.js` restricts origins based on `NODE_ENV`. Update the production domain to match your actual site.  
   - Consider using `helmet` to set secure HTTP headers.

6. **Rate Limiting**  
   - If you expect open endpoints for external requests, consider `express-rate-limit` to mitigate brute-force or DoS attacks on `/auth` routes.

---

## Contributing

We welcome contributions! Here’s how you can help:

1. **Fork** the repository.  
2. **Create** a new branch for your feature: `git checkout -b feature/my-feature`.  
3. **Commit** your changes: `git commit -m 'Add my new feature'`.  
4. **Push** to the branch: `git push origin feature/my-feature`.  
5. **Open** a pull request in this repository.

We will review and merge your changes if they align with the project goals.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](../LICENSE) file for details.

---

**Thank you for using Verifier Backend!**  
Feel free to open issues or pull requests for improvements, bug fixes, or suggestions.