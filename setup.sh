#!/bin/bash

# 🚀 Log Centralizado - Setup Script
# Este script instala e configura a aplicação completa

set -e  # Exit on error

echo "🚀 Log Centralizado - Setup Script"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações do banco de dados
DB_USER="${DB_USER:-frede}"
DB_PASSWORD="${DB_PASSWORD:-asdasd00}"
DB_NAME="${DB_NAME:-log_centralizado}"
DB_HOST="${DB_HOST:-localhost}"

# 1. Verificar se .env existe
echo -e "${YELLOW}📝 Verificando arquivo .env...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✅ Arquivo .env já existe${NC}"
else
    echo -e "${YELLOW}⚠️  Criando arquivo .env...${NC}"
    cat > .env << EOF
DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:3306/${DB_NAME}
NODE_ENV=production
PORT=3000
EOF
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
fi

echo ""

# 2. Verificar se MySQL está rodando
echo -e "${YELLOW}🗄️  Verificando MySQL...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL não está instalado${NC}"
    echo "Instale com: sudo apt-get install mysql-server"
    exit 1
fi

# Tentar conectar ao MySQL
if ! mysql -u${DB_USER} -p${DB_PASSWORD} -e "SELECT 1" &> /dev/null; then
    echo -e "${RED}❌ Não conseguiu conectar ao MySQL${NC}"
    echo "Verifique as credenciais ou inicie o MySQL com: sudo systemctl start mysql"
    exit 1
fi
echo -e "${GREEN}✅ MySQL está rodando${NC}"

echo ""

# 3. Criar banco de dados se não existir
echo -e "${YELLOW}🗄️  Criando banco de dados...${NC}"
mysql -u${DB_USER} -p${DB_PASSWORD} << EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
USE ${DB_NAME};
EOF
echo -e "${GREEN}✅ Banco de dados criado/verificado${NC}"

echo ""

# 4. Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
pnpm install
echo -e "${GREEN}✅ Dependências instaladas${NC}"

echo ""

# 5. Executar migrations
echo -e "${YELLOW}🗄️  Executando migrations do banco de dados...${NC}"
pnpm db:push
echo -e "${GREEN}✅ Migrations executadas${NC}"

echo ""

# 6. Resumo final
echo -e "${GREEN}🎉 Setup concluído!${NC}"
echo ""
echo "📋 Informações da instalação:"
echo "   Database: ${DB_NAME}"
echo "   User: ${DB_USER}"
echo "   Host: ${DB_HOST}"
echo "   Port: 3000"
echo ""
echo "Para iniciar a aplicação, execute:"
echo -e "${YELLOW}   pnpm run dev${NC}"
echo ""
echo "Para acessar a aplicação:"
echo -e "${YELLOW}   http://localhost:3000${NC}"
echo ""
