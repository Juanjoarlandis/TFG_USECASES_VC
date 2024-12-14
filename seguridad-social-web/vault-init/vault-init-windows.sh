#!/usr/bin/env bash
set -euo pipefail

# DEBUG_LOGS se interpreta igual que antes, si quieres habilitar logs, export DEBUG_LOGS=true

log_debug() {
  if [ "${DEBUG_LOGS:-}" = "true" ]; then
    echo "[DEBUG] $*"
  fi
}

VAULT_ADDR="http://vault:8200"
export VAULT_ADDR
log_debug "VAULT_ADDR set to $VAULT_ADDR"

# Esperar a que Vault esté accesible
for i in {1..30}; do
  log_debug "Intento $i: comprobando estado de Vault"
  if curl -s ${VAULT_ADDR}/v1/sys/health | grep '"initialized":true' > /dev/null; then
    log_debug "Vault inicializado y accesible"
    break
  fi
  log_debug "Vault no accesible aún, esperando 2s..."
  sleep 2
done

if [ ! -f unseal-keys.txt ]; then
  echo "[ERROR] No se encontró unseal-keys.txt"
  exit 1
fi

log_debug "Leyendo unseal-keys.txt"
UNSEAL_KEYS=($(cat unseal-keys.txt))
if [ "${DEBUG_LOGS:-}" = "true" ]; then
  for k in "${UNSEAL_KEYS[@]}"; do
    log_debug "KEY: $k"
  done
fi

log_debug "Procediendo a unseal con las primeras 3 llaves"
for key in "${UNSEAL_KEYS[@]:0:3}"; do
  log_debug "Unsealing con key: $key"
  vault operator unseal "$key"
done

log_debug "Comprobando si Vault sigue sellado"
SEALED=$(vault status -format=json | jq -r .sealed)
log_debug "Valor de SEALED: $SEALED"
if [ "$SEALED" = "true" ]; then
  echo "[ERROR] Vault sigue sellado. Revisa las unseal keys."
  exit 1
fi

log_debug "Vault unsealed con éxito."

# Login con el token root
if [ ! -f root-token.txt ]; then
  echo "[ERROR] No se encontró root-token.txt"
  exit 1
fi

ROOT_TOKEN=$(cat root-token.txt)
log_debug "Root token leído: $ROOT_TOKEN"
log_debug "Logueándose con el root token"
vault login $ROOT_TOKEN

log_debug "Aplicando policies"
vault policy write issuer1-policy issuer1-policy.hcl
log_debug "issuer1-policy aplicada"
vault policy write issuer2-policy issuer2-policy.hcl
log_debug "issuer2-policy aplicada"
vault policy write issuer3-policy issuer3-policy.hcl
log_debug "issuer3-policy aplicada"

log_debug "Creando roles AppRole"
vault write auth/approle/role/issuer1-role token_policies="issuer1-policy"
log_debug "issuer1-role creado"
vault write auth/approle/role/issuer2-role token_policies="issuer2-policy"
log_debug "issuer2-role creado"
vault write auth/approle/role/issuer3-role token_policies="issuer3-policy"
log_debug "issuer3-role creado"

ISSUERS=("issuer1" "issuer2" "issuer3")

echo "[INFO] A continuación se mostrarán los ROLE_ID y SECRET_ID para cada issuer. Por favor, cópialos manualmente."
for ISSUER in "${ISSUERS[@]}"; do
  log_debug "Procesando $ISSUER"
  ROLE_ID_JSON=$(vault read -format=json auth/approle/role/${ISSUER}-role/role-id)
  ROLE_ID=$(echo "$ROLE_ID_JSON" | jq -r .data.role_id)
  SECRET_ID_JSON=$(vault write -f -format=json auth/approle/role/${ISSUER}-role/secret-id)
  SECRET_ID=$(echo "$SECRET_ID_JSON" | jq -r .data.secret_id)

  UPPER_ISSUER=$(echo "$ISSUER" | tr '[:lower:]' '[:upper:]')
  echo "ROLE_ID_${UPPER_ISSUER}=$ROLE_ID"
  echo "SECRET_ID_${UPPER_ISSUER}=$SECRET_ID"
done

log_debug "ROLE_ID y SECRET_ID mostrados por pantalla."
log_debug "Script completado con éxito."

exit 0
