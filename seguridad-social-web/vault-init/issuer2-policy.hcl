path "transit/keys/issuer2-key" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "transit/sign/issuer2-key" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "transit/keys" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
