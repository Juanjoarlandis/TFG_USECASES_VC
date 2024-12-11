#!/usr/bin/env bash
set -e

echo "Esperando a que Vault esté disponible..."
sleep 8

echo "Vault está disponible, configurando..."

# Habilitar Transit
vault secrets enable transit
vault write -f transit/keys/my-key type=ed25519

# Habilitar approle
vault auth enable approle

# Crear la policy
cat > /tmp/transit-policy.hcl <<EOF
path "transit/*" {
  capabilities = ["create", "update", "read", "delete", "list"]
}
EOF

vault policy write transit-policy /tmp/transit-policy.hcl

# Crear el AppRole
vault write auth/approle/role/my-role \
  token_policies="transit-policy" \
  token_type="batch"

ROLE_ID=$(vault read -field=role_id auth/approle/role/my-role/role-id)

# Crear secret_id usando -f (force) y parsear su salida con jq
# Primero instalamos jq (si no lo tienes, agrégalo al Dockerfile)
SECRET_JSON=$(vault write -f auth/approle/role/my-role/secret-id -format=json)
SECRET_ID=$(echo "$SECRET_JSON" | jq -r '.data.secret_id')

# Asegúrate de que la carpeta /env existe en el host (en docker-compose se montará)
mkdir -p ../env
echo "ROLE_ID=$ROLE_ID" > ../env/vault_approle.env
echo "SECRET_ID=$SECRET_ID" >> ../env/vault_approle.env

echo "Configuración de Vault completada. Role_ID y Secret_ID guardados."
