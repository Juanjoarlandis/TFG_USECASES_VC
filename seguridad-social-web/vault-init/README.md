# Vault Initialization and Configuration

This repository provides the necessary scripts, configurations, and instructions to initialize and configure a HashiCorp Vault instance, including policies, AppRoles, and unseal workflows. The setup also includes containerized initialization for automated environments.

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Details of Provided Files](#details-of-provided-files)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Requirements

- Docker and Docker Compose
- Bash shell
- `vault` CLI installed locally (optional for manual interactions)
- Internet connection for downloading dependencies

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vault-init
   ```

2. Build the `vault-init` container image:
   ```bash
   docker-compose build vault-init
   ```

3. Set up the required Docker network and volume:
   ```bash
   ./setup_all.sh
   ```

## Configuration

### Vault Configuration

The `config.hcl` file defines the Vault server settings:

```hcl
ui = true

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true
}

storage "file" {
  path = "/vault/file"
}

disable_mlock = true

api_addr = "http://127.0.0.1:8200"
cluster_addr = "https://127.0.0.1:8201"
```

### Policies

Three example policies (`issuer1-policy.hcl`, `issuer2-policy.hcl`, and `issuer3-policy.hcl`) define permissions for different roles. Example:

```hcl
path "transit/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
```

### Initialization Script

The `vault-init.sh` script automates the unseal process and AppRole setup.

## Usage

1. Start the Vault server:
   ```bash
   docker-compose up -d vault
   ```

2. Initialize the Vault:
   ```bash
   docker-compose up vault-init
   ```

3. Check logs or environment files (`env/vault_approle.env`) for generated AppRole credentials.

## Details of Provided Files

### Configuration Files

- `config.hcl`: Main Vault configuration.
- `issuer*-policy.hcl`: Policies for different AppRoles.

### Scripts

- `setup_all.sh`: Automates the setup of Docker network, volume, and Vault initialization.
- `vault-init.sh`: Handles unsealing and AppRole configuration.

### Docker Compose

- `docker-compose.yml`: Orchestrates Vault and `vault-init` containers.

### Credentials

- `credentials/unseal-keys.txt`: Placeholder for unseal keys.
- `credentials/root-token.txt`: Placeholder for root token.

### Output

- `env/vault_approle.env`: Contains AppRole credentials after initialization.

## Troubleshooting

- **Vault remains sealed**:
  Ensure `unseal-keys.txt` contains valid keys and the script runs without errors.

- **Container not starting**:
  Check Docker logs:
  ```bash
  docker logs <container-name>
  ```

- **Policies not applied**:
  Verify paths and policy files for syntax errors.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
