
# Verifier Backend

This **Verifier Backend** is a Node.js/Express application that facilitates the verification of **Verifiable Credentials (VCs)** in a **Social Security** context. In addition to credential verification, it provides functionalities for credential issuance, revocation, and user management. The project communicates with a **Wallet** (such as a walt.id wallet or similar) and an **Issuer** API to complete credential-oriented flows.

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
  Uses an **OID4VC** flow to receive proof requests, decode and validate the provided credentials, and determine if they are valid and not revoked.

- **Issuance of Verifiable Credentials**  
  Generates and sends credential offers (in JWT format) to the holder’s wallet, with callback endpoints for tracking issuance status.

- **Credential Revocation**  
  Maintains a revocation list (using a MongoDB collection) for revoked credentials. Revoked credentials will fail subsequent verifications.

- **User Management**  
  Registers and updates user data in MongoDB, with sensitive fields (e.g., Social Security Number) encrypted via **mongoose-encryption**. Provides REST endpoints to retrieve user information by document number (DNI).

- **Authentication**  
  Implements a JWT-based authentication flow with access tokens (15 minutes expiration) and refresh tokens (7 days expiration). Supports token refresh and session management.

- **Logging**  
  Uses **Winston** for structured logging with customizable log levels and formatting.

- **Rate Limiting**  
  Protects endpoints (e.g., `/auth/wallet-login`) against brute-force and DoS attacks using **express-rate-limit**.

---

## Technologies and Dependencies

Key dependencies (exact versions in `package.json`):

- [**Node.js**](https://nodejs.org/) (v16+)
- [**Express**](https://expressjs.com/)
- [**Mongoose**](https://mongoosejs.com/) (MongoDB ORM)
- [**mongoose-encryption**](https://github.com/joegoldbeck/mongoose-encryption) for field-level encryption
- [**jsonwebtoken**](https://www.npmjs.com/package/jsonwebtoken) for JWT handling
- [**dotenv**](https://github.com/motdotla/dotenv) for managing environment variables
- [**axios**](https://axios-http.com/) for HTTP requests
- [**uuid**](https://www.npmjs.com/package/uuid) for generating unique identifiers
- [**winston**](https://www.npmjs.com/package/winston) for logging
- [**cors**](https://www.npmjs.com/package/cors) for Cross-Origin Resource Sharing
- [**express-rate-limit**](https://www.npmjs.com/package/express-rate-limit) for rate limiting

---

## Project Structure

```
backend/
├── app.js                     # Main entry point (Express server configuration)
├── package.json               # Project metadata and scripts
├── Dockerfile                 # Docker build configuration
├── .env                       # Environment variables (should be kept secure)
├── src/
│   ├── controllers/           # Controllers containing request/response logic
│   ├── middleware/            # Express middlewares (error handling, CORS, logging, rate limiting)
│   ├── models/                # Mongoose schema definitions (User, RevokedCredential, etc.)
│   ├── routes/                # Route definitions mapping endpoints to controllers
│   ├── services/              # Reusable business logic (wallet sessions, presentation, authentication, etc.)
│   └── utils/                 # Utility functions (JWT utilities, validations, session store, etc.)
├── logger.js                  # Winston logger configuration
├── signing_key_base64.txt     # Example file containing a signing key
├── encryption_key_base64.txt  # Example file containing an encryption key
└── README.md                  # Project documentation
```

**Key Components:**

- **`app.js`**: Bootstraps the application by connecting to the database, configuring middlewares, registering routes, and starting the server.
- **`src/routes/`**: Organizes application routes by domain (e.g., authentication, verification, issuance, revocation, wallet operations, etc.).
- **`src/controllers/`**: Contains the request handling logic that interacts with the services.
- **`src/services/`**: Implements reusable business logic (e.g., wallet session management, presentation handling, authentication flows).
- **`src/models/`**: Defines data models (e.g., User, RevokedCredential) for MongoDB using Mongoose.
- **`src/middleware/`**: Contains Express middlewares (error handling, CORS configuration, request logging, rate limiting).
- **`src/utils/`**: Utility functions for JWT handling, validations, and session storage.
- **`logger.js`**: Configures Winston for structured logging.

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

   Create a `.env` file in the `backend` directory (or copy the provided example) with the following configuration:

   ```bash
   WALTID_VERIFIER_URL=http://caddy:7003
   WALTID_ISSUER_URL=http://caddy:7002
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

   HOLDER_EMAIL=holder@example.com
   HOLDER_PASSWORD=holderpassword
   HOLDER_TYPE=email
   HOLDER_NAME='Holder User'
   ```

   **Important:** Ensure that the environment variable values match your environment settings (container names, ports, etc.). Do not commit your `.env` file to version control.

5. **Start the Server**

   ```bash
   npm start
   ```

   The application will listen on the port specified (default is 3001).

---

## Configuration

The following environment variables are used to configure the application:

- **PORT**: Defines the port on which the server listens (default: 3001).
- **MONGO_URI**: MongoDB connection string.
- **JWT_SECRET** & **JWT_REFRESH_SECRET**: Secrets for signing and verifying JWT access and refresh tokens.
- **ENCRYPTION_KEY** & **SIGNING_KEY**: Keys for field-level encryption in MongoDB.
- **WALTID_VERIFIER_URL** & **WALTID_ISSUER_URL**: URLs for external verification and issuance flows.
- **VERIFIER_COORD_PUBLIC_URL**: Public URL for the verifier coordinator, used in callback endpoints.
- **WALLET_COORD_URL**: URL for the Wallet Coordinator service.
- **ISS_COORD_URL**: URL for the Issuer Coordinator service.
- **CREDENTIAL_CONFIGURATION_ID**: Credential configuration identifier used during credential issuance.
- **HOLDER_EMAIL**, **HOLDER_PASSWORD**, **HOLDER_TYPE**, **HOLDER_NAME**: Default holder credentials for testing or fallback purposes.

Adjust these settings in your `.env` file to match your deployment environment.

---

## Usage

Once the server is running, the backend exposes several REST endpoints. Here is a brief overview:

### 1. Verification Routes

- **POST `/verification/offer`**  
  Initiates a verification offer for a single credential (OID4VC flow).

- **POST `/verification/offer3creds`**  
  Initiates a manual verification offer requiring exactly 3 credentials.

- **POST `/verification/offer3credsAuto`**  
  Initiates an automatic verification offer for exactly 3 credentials.

- **POST `/verification/statusCallback/:stateId`**  
  Receives a callback from the verifier service after a verification flow is completed.

- **POST `/verification/statusCallbackAlta/:stateId`**  
  Receives a callback specifically for 3-credential (Alta) verification flows.

- **POST `/verification/statusCallbackWalletLogin/:stateId`**  
  Receives a callback for wallet login verification flows.

- **GET `/verification/session/:stateId`**  
  Retrieves the status of a verification session (e.g., pending, verified, failed, expired).

### 2. Issuance Routes

- **POST `/issuance/offerIssuance`**  
  Initiates a credential issuance offer.

- **POST `/issuance/statusCallback/:stateId`**  
  Receives a callback from the issuer service after the issuance flow completes.

- **GET `/issuance/session/:stateId`**  
  Retrieves the current issuance session status (e.g., offered, accepted, claimed).

- **POST `/issuance/claimAltaCredential`**  
  Claims a credential and stores it in the holder’s wallet.

### 3. User Management

- **GET `/user/:dni`**  
  Retrieves user information (e.g., first name, family name, birth date) by document number (DNI).

### 4. Credential Revocation

- **POST `/revocar/credencial`**  
  Revokes a credential by marking it in the MongoDB `RevokedCredential` collection and optionally deleting it from the wallet.

### 5. Authentication

- **POST `/auth/wallet-login`**  
  Authenticates the user’s wallet using email/password and initiates an automatic verification flow for an identity credential.

- **POST `/auth/refresh`**  
  Refreshes the JWT tokens by exchanging a valid refresh token for new access and refresh tokens.

### 6. Wallet Routes

- **GET `/wallet-api/ping`**  
  A simple health-check endpoint.

- **GET `/wallet-api/user-info`**  
  Retrieves the authenticated holder’s user information from the wallet.

- **Credential Operations**:  
  Endpoints for listing, retrieving, deleting, accepting, rejecting, and checking the status of credentials.  
  - **GET `/wallet-api/credentials`**  
  - **GET `/wallet-api/credentials/:id`**  
  - **DELETE `/wallet-api/credentials/:id`**  
  - **POST `/wallet-api/credential-offer`**  
  - **POST `/wallet-api/credentials/:id/accept`**  
  - **POST `/wallet-api/credentials/:id/reject`**  
  - **GET `/wallet-api/credentials/:id/status`**

- **Presentation Operations**:  
  Endpoints for resolving a presentation request, matching credentials for a presentation, and using a presentation request.  
  - **POST `/wallet-api/resolve-presentation-request`**  
  - **POST `/wallet-api/match-credentials`**  
  - **POST `/wallet-api/use-presentation-request`**

---

## Docker Support

A basic Docker setup is included for containerization:

1. **Build the Image**

   ```bash
   docker build -t verifier-backend .
   ```

2. **Run the Container**

   ```bash
   docker run -p 3001:3001 --env-file .env verifier-backend
   ```

   This will start the container, exposing port **3001**. Ensure that your MongoDB instance is accessible from within the container, or use Docker Compose to link services appropriately.

---

## Security Considerations

1. **Environment Variables**  
   Never commit secrets (JWT keys, encryption keys, etc.) to version control. Use a secure method (e.g., secret managers) to handle sensitive configurations.

2. **Field-Level Encryption**  
   Sensitive fields (e.g., `nss`) are encrypted in MongoDB using **mongoose-encryption**. Review which fields require encryption based on compliance requirements (e.g., GDPR).

3. **JWT Handling**  
   - Access tokens have a short lifespan (default 15 minutes) and refresh tokens last 7 days.
   - Always validate tokens on protected routes.
   - Implement token rotation and proper storage of refresh tokens.

4. **Logging**  
   - Logging is handled using Winston with a default log level of `debug`. In production, consider increasing the log level to `info` or `warn` to avoid logging sensitive information.
   - Ensure that sensitive data is not logged.

5. **CORS**  
   - The CORS configuration restricts origins based on the `NODE_ENV`. Update the production settings to match your domain.
   - Consider using additional security headers (e.g., via the `helmet` package).

6. **Rate Limiting**  
   - Rate limiting is applied to sensitive endpoints (e.g., `/auth/wallet-login`) using **express-rate-limit**.
   - Adjust rate limits according to expected traffic and threat models.

---

## Contributing

Contributions are welcome! To contribute:

1. **Fork** the repository.
2. **Create** a new branch for your feature:
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Commit** your changes:
   ```bash
   git commit -m 'Add my new feature'
   ```
4. **Push** the branch:
   ```bash
   git push origin feature/my-feature
   ```
5. **Open** a pull request in this repository.

We will review your changes and merge them if they align with the project goals.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](../LICENSE) file for details.

---

**Thank you for using Verifier Backend!**  
Feel free to open issues or submit pull requests for improvements, bug fixes, or feature suggestions.

---
