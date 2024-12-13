#!/usr/bin/env bash
set -euo pipefail

VAULT_NETWORK="my_network"
VAULT_VOLUME="vault-data-new"
VAULT_CONTAINER_NAME="vault"
VAULT_INIT_CONTAINER_NAME="vault-init-container"
VAULT_ADDR="http://127.0.0.1:8200"
VAULT_IMAGE="hashicorp/vault"
INIT_IMAGE="vault-init-image"   # Nombre de la imagen que construiremos para vault-init
ENV_DIR="./env"

# Crear la red si no existe
docker network inspect $VAULT_NETWORK >/dev/null 2>&1 || docker network create $VAULT_NETWORK

# Crear el volumen
docker volume create $VAULT_VOLUME

# Copiar datos al volumen
docker run --rm -d --name vault-temp -v $VAULT_VOLUME:/vault/file alpine sleep 3600
docker cp vault-data/. vault-temp:/vault/file/
# Después de cp:
docker exec vault-temp chown -R 100:100 /vault/file
docker exec vault-temp chmod -R 700 /vault/file
docker stop vault-temp

docker stop vault-temp

# Lanzar Vault
docker run --cap-add=IPC_LOCK --name $VAULT_CONTAINER_NAME -d \
  --network $VAULT_NETWORK \
  -v $(pwd)/config.hcl:/vault/config/config.hcl \
  -v $VAULT_VOLUME:/vault/file \
  -p 8200:8200 \
  $VAULT_IMAGE server

echo "Esperando a que Vault arranque..."
sleep 5

# Construir la imagen vault-init con Ubuntu y Vault CLI
cat > Dockerfile.vault-init <<EOF
FROM ubuntu:22.04

# Instalar dependencias para Vault
RUN apt-get update && apt-get install -y gpg wget curl jq unzip lsb-release ca-certificates gnupg

# Añadir keyring de HashiCorp
RUN wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
RUN gpg --no-default-keyring --keyring /usr/share/keyrings/hashicorp-archive-keyring.gpg --fingerprint
RUN echo "deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com \$(lsb_release -cs) main" > /etc/apt/sources.list.d/hashicorp.list

RUN apt-get update && apt-get install -y vault

WORKDIR /work
EOF

docker build -f Dockerfile.vault-init -t $INIT_IMAGE .

# Crear contenedor vault-init-container
# Montar unseal-keys.txt, hcl de policies, vault-init.sh y la carpeta env
docker run --rm -d --name $VAULT_INIT_CONTAINER_NAME \
  --network $VAULT_NETWORK \
  -v $(pwd)/credentials/unseal-keys.txt:/work/unseal-keys.txt:ro \
  -v $(pwd)/credentials/root-token.txt:/work/root-token.txt:ro \
  -v $(pwd)/issuer1-policy.hcl:/work/issuer1-policy.hcl:ro \
  -v $(pwd)/issuer2-policy.hcl:/work/issuer2-policy.hcl:ro \
  -v $(pwd)/issuer3-policy.hcl:/work/issuer3-policy.hcl:ro \
  -v $(pwd)/vault-init.sh:/work/vault-init.sh:ro \
  -v $(pwd)/env:/work/env \
  $INIT_IMAGE sleep 3600

# Ejecutar vault-init.sh dentro del contenedor vault-init-container
docker exec $VAULT_INIT_CONTAINER_NAME bash /work/vault-init.sh DEBUG_LOGS=false

echo "Script vault-init.sh ejecutado en el contenedor $VAULT_INIT_CONTAINER_NAME."
echo "Comprueba env/vault_approle.env en el host para las credenciales AppRole."
echo "Proceso completado."
