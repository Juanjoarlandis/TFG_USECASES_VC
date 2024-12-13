#!/usr/bin/env bash
set -euo pipefail
#set -x  # Descomenta esta línea si quieres mostrar cada comando ejecutado

VAULT_ADDR="http://vault:8200"
export VAULT_ADDR
echo "[DEBUG] VAULT_ADDR set to $VAULT_ADDR"

# Esperar a que Vault esté accesible
for i in {1..30}; do
  echo "[DEBUG] Intento $i: comprobando estado de Vault"
  if curl -s ${VAULT_ADDR}/v1/sys/health | grep '"initialized":true' > /dev/null; then
    echo "[DEBUG] Vault inicializado y accesible"
    break
  fi
  echo "[DEBUG] Vault no accesible aún, esperando 2s..."
  sleep 2
done

if [ ! -f unseal-keys.txt ]; then
  echo "[ERROR] No se encontró unseal-keys.txt"
  exit 1
fi

echo "[DEBUG] Leyendo unseal-keys.txt"
UNSEAL_KEYS=($(cat unseal-keys.txt))
echo "[DEBUG] Unseal Keys obtenidas:"
for k in "${UNSEAL_KEYS[@]}"; do
  echo "[DEBUG] KEY: $k"
done

echo "[DEBUG] Procediendo a unseal con las primeras 3 llaves"
for key in "${UNSEAL_KEYS[@]:0:3}"; do
  echo "[DEBUG] Unsealing con key: $key"
  vault operator unseal "$key"
done

echo "[DEBUG] Comprobando si Vault sigue sellado"
SEALED=$(vault status -format=json | jq -r .sealed)
echo "[DEBUG] Valor de SEALED: $SEALED"
if [ "$SEALED" = "true" ]; then
  echo "[ERROR] Vault sigue sellado. Revisa las unseal keys."
  exit 1
fi

echo "[DEBUG] Vault unsealed con éxito."

# Login con el token root
if [ ! -f root-token.txt ]; then
  echo "[ERROR] No se encontró root-token.txt"
  exit 1
fi

ROOT_TOKEN=$(cat root-token.txt)
echo "[DEBUG] Root token leído: $ROOT_TOKEN"
echo "[DEBUG] Logueándose con el root token"
vault login $ROOT_TOKEN

echo "[DEBUG] Aplicando policies"
vault policy write issuer1-policy issuer1-policy.hcl
echo "[DEBUG] issuer1-policy aplicada"
vault policy write issuer2-policy issuer2-policy.hcl
echo "[DEBUG] issuer2-policy aplicada"
vault policy write issuer3-policy issuer3-policy.hcl
echo "[DEBUG] issuer3-policy aplicada"

echo "[DEBUG] Creando roles AppRole"
vault write auth/approle/role/issuer1-role token_policies="issuer1-policy"
echo "[DEBUG] issuer1-role creado"
vault write auth/approle/role/issuer2-role token_policies="issuer2-policy"
echo "[DEBUG] issuer2-role creado"
vault write auth/approle/role/issuer3-role token_policies="issuer3-policy"
echo "[DEBUG] issuer3-role creado"

ISSUERS=("issuer1" "issuer2" "issuer3")

OUT_FILE=/work/env/vault_approle.env
echo "[DEBUG] Guardando credenciales AppRole en $OUT_FILE"
echo "# Variables AppRole" > $OUT_FILE

for ISSUER in "${ISSUERS[@]}"; do
  echo "[DEBUG] Procesando $ISSUER"
  ROLE_ID_JSON=$(vault read -format=json auth/approle/role/${ISSUER}-role/role-id)
  echo "[DEBUG] ROLE_ID_JSON: $ROLE_ID_JSON"
  ROLE_ID=$(echo "$ROLE_ID_JSON" | jq -r .data.role_id)
  echo "[DEBUG] ROLE_ID para $ISSUER: $ROLE_ID"

  SECRET_ID_JSON=$(vault write -f -format=json auth/approle/role/${ISSUER}-role/secret-id)
  echo "[DEBUG] SECRET_ID_JSON: $SECRET_ID_JSON"
  SECRET_ID=$(echo "$SECRET_ID_JSON" | jq -r .data.secret_id)
  echo "[DEBUG] SECRET_ID para $ISSUER: $SECRET_ID"

  UPPER_ISSUER=$(echo "$ISSUER" | tr '[:lower:]' '[:upper:]')
  echo "[DEBUG] UPPER_ISSUER: $UPPER_ISSUER"
  echo "ROLE_ID_${UPPER_ISSUER}=$ROLE_ID" >> $OUT_FILE
  echo "SECRET_ID_${UPPER_ISSUER}=$SECRET_ID" >> $OUT_FILE
done

echo "[DEBUG] ROLE_ID y SECRET_ID guardados en $OUT_FILE."
echo "[DEBUG] Script completado con éxito."

exit 0
