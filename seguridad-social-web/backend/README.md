# Verifier Backend

## Description
This project implements a backend for the verification of verifiable credentials in the context of Social Security. It enables credential verification, issuance of Social Security registration credentials, credential revocation, and user management.

## Key Features
- **Verification of Verifiable Credentials** using OpenID for Verifiable Credentials (OID4VC).
- **Issuance of Verifiable Credentials** in JWT format.
- **User Management**: Registration and update of user data with encrypted fields.
- **Credential Revocation**: Management of revoked credentials.

## Main Dependencies
- **Express**: Web framework for Node.js.
- **Mongoose**: ORM for MongoDB.
- **jsonwebtoken**: JWT generation and verification.
- **axios**: HTTP client for external requests.
- **dotenv**: Environment variable management.
- **mongoose-encryption**: Encryption for sensitive fields in MongoDB.
- **uuid**: Unique identifier generation.

## Prerequisites
1. **Node.js** (version 16 or higher).
2. **MongoDB** (version 4.0 or higher).
3. **Docker** (optional for running the backend image).

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-repository/verifier-backend.git
   cd verifier-backend/backend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Configure the environment variables. Create a `.env` file based on the `.env.example` file and fill in the required values:
   ```env
   WALTID_VERIFIER_URL=http://verifier-api:7003
   WALTID_ISSUER_URL=http://issuer-api:7002
   VERIFIER_COORD_PUBLIC_URL=http://backend:3001
   MONGO_URI=mongodb://mongo-backend:27017/seguridadSocial
   PORT=3001
   ISS_COORD_URL=http://issuer_coord:5500
   NODE_ENV=production
   JWT_SECRET='your-jwt-secret'
   JWT_REFRESH_SECRET='your-refresh-jwt-secret'
   ENCRYPTION_KEY='your-encryption-key'
   SIGNING_KEY='your-signing-key'
   ISSUER_KEY_JWK={...}
   CREDENTIAL_CONFIGURATION_ID=CustomIdentityCredential_jwt_vc_json
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Access the server at: [http://localhost:3001](http://localhost:3001).

## Usage
### Main Routes
- **Credential Verification**
  - POST `/verification/offer`: Generates a verification offer URL.
  - POST `/verification/statusCallback/:stateId`: Callback for verification status.
  - GET `/verification/session/:stateId`: Retrieves the status of a verification session.

- **Credential Issuance**
  - POST `/issuance/offer`: Generates a credential issuance offer.
  - POST `/issuance/statusCallback/:stateId`: Callback for issuance status.
  - GET `/issuance/session/:stateId`: Retrieves the status of an issuance session.

- **User Management**
  - GET `/user/:dni`: Retrieves user data by DNI.

- **Credential Revocation**
  - POST `/revocar/credencial`: Revokes a specific credential.

- **Authentication**
  - POST `/auth/refresh`: Generates new access and refresh tokens.

## Project Structure
```
backend/
├── app.js                # Main file
├── package.json          # Project configuration
├── Dockerfile            # File for Docker image creation
├── .env                  # Environment variables
├── src/
│   ├── controllers/      # Controllers for business logic
│   ├── middleware/       # Custom middlewares
│   ├── models/           # Data models (Mongoose)
│   ├── routes/           # Route definitions
│   └── utils/            # Utilities and helpers
└── signing_key_base64.txt
```

## Docker
The backend includes a `Dockerfile` for running the project in a Docker container. To build and run the image:

1. Build the image:
   ```bash
   docker build -t verifier-backend .
   ```

2. Run the container:
   ```bash
   docker run -p 3001:3001 --env-file .env verifier-backend
   ```

## Contributing
If you wish to contribute to the project, please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature (`git checkout -b feature/new-feature`).
3. Make your changes and commit (`git commit -m 'Add new feature'`).
4. Submit a pull request.

## License
This project is licensed under the MIT License. For more details, see the LICENSE file.
