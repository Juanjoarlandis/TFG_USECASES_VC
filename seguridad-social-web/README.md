# Social Security Web - Global Project

## Overview

This project provides a comprehensive solution for managing verifiable credentials in the context of Social Security. It consists of several independent modules that interact with each other to provide services such as credential issuance, identity verification, and an accessible web interface.

## Project Architecture
The project consists of the following modules:

### 1. **Frontend**
   - **Description**: Web interface developed with React for user interaction.
   - **Technologies**: React, Redux, TailwindCSS, Axios.
   - **Key Features**:
     - Credential registration and verification.
     - Personal dashboard for data management.
     - Responsive design.

### 2. **Backend**
   - **Description**: Server managing business logic such as credential verification and user data storage.
   - **Technologies**: Node.js, Express, MongoDB.

### 3. **Issuer Coordinator**
   - **Description**: Service dedicated to issuing verifiable credentials.
   - **Technologies**: Node.js, MongoDB.

### 4. **Vault**
   - **Description**: Secure key management system used for storing sensitive information and performing cryptographic operations.
   - **Key Configurations**:
     - Configured with specific policies for different roles.
     - Support for AppRoles used by the modules.

### 5. **Walt.id APIs**
   - **Description**: Set of services for credential issuance, verification, and wallet management.
   - **Technologies**: Services provided by Walt.id via Docker Compose.

## Project Launch
### Prerequisites

1. **Required Software**:
   - Docker and Docker Compose.
   - Node.js and npm (optional for local frontend development).

2. **Initial Configurations**:
   - Create an external Docker network named `my_network`:
     ```bash
     docker network create my_network
     ```

   - Configure SSL certificates for the frontend in `frontend/certs/`.

   - Set up the required environment variables for each module.

### Steps to Launch the Project
1. **Configure and Launch Vault**
   - Navigate to the Vault initialization directory:
     ```bash
     cd vault-init
     ```
   - Build the Vault initialization image:
     ```bash
     docker-compose build vault-init
     ```
   - Start Vault:
     ```bash
     docker-compose up -d vault
     ```
   - Run the initialization container:
     ```bash
     docker-compose up vault-init
     ```
   - **Important Note**: After completing these steps, return to the root directory to launch the next set of services.

2. **Launch the Main Project Services**
   - Start all modules using the main `docker-compose.yaml` file:
     ```bash
     cd ..
     docker-compose up -d
     ```

3. **Launch Walt.id APIs**
   - Navigate to the Walt.id Docker Compose directory:
     ```bash
     cd waltid-identity/docker-compose
     ```
   - Start the services:
     ```bash
     docker compose up -d
     ```
   - **Important Note**: Ensure that you return to this directory after completing the steps in the root directory to effectively launch the Walt.id APIs.

4. **Access the Application**
   - Frontend: [https://localhost](https://localhost)
   - Backend: Available at [http://localhost:3001](http://localhost:3001) for internal consumption by other services.
   - Walt.id APIs: [Issuer API], [Verifier API], [Wallet API].

## Project Structure
- **frontend/**: Contains the frontend source code.
- **backend/**: Contains the backend source code.
- **issuer_coord/**: Issuer coordination service.
- **vault-init/**: Vault initialization configurations and scripts.
- **waltid-identity/**: Contains configurations for Walt.id APIs.

## Contributing
If you want to contribute:

1. Fork the repository.
2. Create a branch for your changes:
   ```bash
   git checkout -b feature/new-feature
   ```
3. Make your changes and commit:
   ```bash
   git commit -m "Description of changes"
   ```
4. Push your changes and create a Pull Request.

## License
This project is licensed under the MIT License. See the `LICENSE` file for more details.
