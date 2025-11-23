#!/bin/bash

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Log Centralizado - Instalação Automática${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Definir diretório de instalação
INSTALL_DIR="/opt/log-centralizado"
REPO_URL="https://github.com/fadv-tech/Log-Central.git"

# 0. Clonar repositório (se não existir)
echo -e "${YELLOW}[0/8] Clonando repositório...${NC}"
if [ ! -d "$INSTALL_DIR" ]; then
    sudo mkdir -p "$INSTALL_DIR"
    sudo git clone "$REPO_URL" "$INSTALL_DIR"
    sudo chown -R $(whoami):$(whoami) "$INSTALL_DIR"
    echo -e "${GREEN}✓ Repositório clonado${NC}\n"
else
    echo -e "${GREEN}✓ Repositório já existe${NC}\n"
fi

cd "$INSTALL_DIR"

# 1. Atualizar sistema
echo -e "${YELLOW}[1/8] Atualizando dependências do sistema...${NC}"
sudo apt-get update -qq
sudo apt-get upgrade -y -qq > /dev/null 2>&1
echo -e "${GREEN}✓ Sistema atualizado${NC}\n"

# 2. Instalar dependências básicas
echo -e "${YELLOW}[2/8] Instalando dependências básicas...${NC}"
sudo apt-get install -y -qq curl wget git build-essential > /dev/null 2>&1
echo -e "${GREEN}✓ Dependências instaladas${NC}\n"

# 3. Verificar e instalar/atualizar Node.js
echo -e "${YELLOW}[3/8] Verificando Node.js...${NC}"
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")

if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}   Node.js versão $NODE_VERSION encontrada. Atualizando para v22...${NC}"
    
    # Remover Node.js antigo
    sudo apt-get remove -y -qq nodejs npm > /dev/null 2>&1 || true
    
    # Instalar Node.js v22 via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y -qq nodejs > /dev/null 2>&1
    
    echo -e "${GREEN}✓ Node.js v$(node -v) instalado${NC}\n"
else
    echo -e "${GREEN}✓ Node.js v$(node -v) OK${NC}\n"
fi

# 4. Instalar pnpm
echo -e "${YELLOW}[4/8] Verificando pnpm...${NC}"
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm -q > /dev/null 2>&1
    echo -e "${GREEN}✓ pnpm instalado${NC}\n"
else
    echo -e "${GREEN}✓ pnpm $(pnpm -v) OK${NC}\n"
fi

# 5. Instalar MySQL/MariaDB
echo -e "${YELLOW}[5/8] Instalando MySQL/MariaDB...${NC}"
if ! command -v mysql &> /dev/null; then
    sudo apt-get install -y -qq mariadb-server > /dev/null 2>&1
    sudo systemctl start mariadb
    sudo systemctl enable mariadb
    echo -e "${GREEN}✓ MySQL/MariaDB instalado${NC}\n"
else
    echo -e "${GREEN}✓ MySQL/MariaDB já instalado${NC}\n"
    sudo systemctl start mariadb 2>/dev/null || true
fi

# 6. Criar banco de dados e usuário
echo -e "${YELLOW}[6/8] Configurando banco de dados...${NC}"

# Gerar senha aleatória
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_USER="log_central_user"
DB_NAME="log_centralizado"

# Criar banco e usuário
sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
sudo mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';" 2>/dev/null || true
sudo mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';" 2>/dev/null || true
sudo mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

echo -e "${GREEN}✓ Banco de dados criado${NC}"
echo -e "${YELLOW}   Database: $DB_NAME${NC}"
echo -e "${YELLOW}   User: $DB_USER${NC}"
echo -e "${YELLOW}   Password: $DB_PASSWORD${NC}\n"

# 7. Instalar dependências do projeto
echo -e "${YELLOW}[7/8] Instalando dependências do projeto...${NC}"
cd "$INSTALL_DIR"
pnpm install -q > /dev/null 2>&1
echo -e "${GREEN}✓ Dependências instaladas${NC}\n"

# 8. Configurar variáveis de ambiente e rodar migrações
echo -e "${YELLOW}[8/8] Configurando aplicação...${NC}"

# Criar arquivo .env
cat > "$INSTALL_DIR/.env" << EOF
DATABASE_URL="mysql://$DB_USER:$DB_PASSWORD@localhost:3306/$DB_NAME"
JWT_SECRET="$(openssl rand -base64 32)"
VITE_APP_TITLE="Log Centralizado"
VITE_APP_LOGO="/logo.svg"
NODE_ENV="production"
PORT="3000"
EOF

# Rodar migrações
cd "$INSTALL_DIR"
pnpm db:push > /dev/null 2>&1 || true

echo -e "${GREEN}✓ Aplicação configurada${NC}\n"

# Exibir informações finais
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Instalação Concluída com Sucesso!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Próximos passos:${NC}"
echo -e "1. Entre no diretório: ${GREEN}cd $INSTALL_DIR${NC}"
echo -e "2. Inicie a aplicação: ${GREEN}pnpm dev${NC}"
echo -e "3. Acesse em: ${GREEN}http://localhost:3000${NC}\n"

echo -e "${YELLOW}Informações do Banco de Dados:${NC}"
echo -e "  Database: ${GREEN}$DB_NAME${NC}"
echo -e "  User: ${GREEN}$DB_USER${NC}"
echo -e "  Password: ${GREEN}$DB_PASSWORD${NC}"
echo -e "  Host: ${GREEN}localhost${NC}"
echo -e "  Port: ${GREEN}3306${NC}\n"

echo -e "${YELLOW}Para iniciar o serviço em background:${NC}"
echo -e "  ${GREEN}cd $INSTALL_DIR && nohup pnpm dev > log_centralizado.log 2>&1 &${NC}\n"

echo -e "${YELLOW}Para parar o serviço:${NC}"
echo -e "  ${GREEN}pkill -f 'pnpm dev'${NC}\n"

echo -e "${YELLOW}Para ver os logs:${NC}"
echo -e "  ${GREEN}tail -f $INSTALL_DIR/log_centralizado.log${NC}\n"

echo -e "${YELLOW}Documentação:${NC}"
echo -e "  API Responses: https://github.com/fadv-tech/Log-Central/blob/main/API_RESPONSES.md"
echo -e "  Performance: https://github.com/fadv-tech/Log-Central/blob/main/PERFORMANCE.md"
echo -e "  Mikrotik Setup: https://github.com/fadv-tech/Log-Central/blob/main/MIKROTIK_SETUP.md\n"
