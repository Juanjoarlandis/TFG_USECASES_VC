FROM ubuntu:latest

# Instalar bash, curl, wget, y gnupg (para gpg)
RUN apt-get update && apt-get install -y wget curl bash gnupg lsb-release jq && rm -rf /var/lib/apt/lists/*

# Instalar Vault CLI
RUN curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor > hashicorp.gpg
RUN install -o root -g root -m 644 hashicorp.gpg /usr/share/keyrings/hashicorp-archive-keyring.gpg
RUN echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" > /etc/apt/sources.list.d/hashicorp.list
RUN apt-get update && apt-get install -y vault && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia el script de inicialización
COPY init-vault.sh /app/init-vault.sh
RUN chmod +x /app/init-vault.sh

# Este contenedor se ejecutará una sola vez, para inicializar Vault.
CMD ["/bin/bash", "/app/init-vault.sh"]
