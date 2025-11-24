#!/bin/bash

echo "🚀 Log Centralizado - Setup Script"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    
    # Generate JWT Secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your-secret-key-here-change-in-production/$JWT_SECRET/g" .env
    
    echo "✅ Arquivo .env criado com sucesso!"
    echo ""
    echo "📋 Configuração:"
    grep DATABASE_URL .env
else
    echo "✅ Arquivo .env já existe"
fi

echo ""
echo "📦 Instalando dependências..."
pnpm install

echo ""
echo "🎉 Setup concluído!"
echo ""
echo "Para iniciar a aplicação, execute:"
echo "  pnpm dev"
