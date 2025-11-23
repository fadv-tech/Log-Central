# Log Centralizado

Serviço de log centralizado 100% self-contained para coletar, armazenar e visualizar logs de múltiplos servidores (Windows, Linux, Mikrotik).

## Características

- ✅ **Zero Dependências Cloud** - Sem AWS, Manus ou qualquer serviço externo
- ✅ **100% Automático** - Script de instalação que configura tudo sozinho
- ✅ **Banco de Dados Local** - MySQL/MariaDB integrado
- ✅ **API de Ingestão** - Recebe logs de qualquer servidor
- ✅ **Frontend Robusto** - Dashboard com busca avançada de logs
- ✅ **Validação de IP** - Controle de quais IPs podem enviar logs
- ✅ **API Keys** - Autenticação segura para ingestão

## Instalação Rápida (Uma Linha)

```bash
curl -fsSL https://raw.githubusercontent.com/fadv-tech/Log-Central/main/install.sh | sudo bash
```

Ou clone e execute:

```bash
git clone https://github.com/fadv-tech/Log-Central.git
cd Log-Central
sudo ./install.sh
```

## O que o Script Faz

1. ✅ Atualiza dependências do sistema
2. ✅ Verifica Node.js (v18+) - desinstala e reinstala se necessário
3. ✅ Instala pnpm
4. ✅ Instala MySQL/MariaDB
5. ✅ Cria banco de dados e usuário com senha aleatória
6. ✅ Instala dependências do projeto
7. ✅ Configura variáveis de ambiente
8. ✅ Roda migrações do banco

## Iniciar a Aplicação

Após a instalação:

```bash
# Desenvolvimento
pnpm dev

# Produção (em background)
nohup pnpm dev > log_centralizado.log 2>&1 &
```

Acesse: **http://localhost:3000**

## Parar a Aplicação

```bash
pkill -f 'pnpm dev'
```

## Arquitetura

- **Backend**: Express.js + tRPC
- **Frontend**: React 19 + Tailwind CSS
- **Banco de Dados**: MySQL/MariaDB
- **Autenticação**: API Keys

## Estrutura de Diretórios

```
Log-Central/
├── client/              # Frontend React
│   └── src/
│       ├── pages/       # Dashboard, Buscar Logs, Servidores, Configurações
│       └── components/  # Componentes reutilizáveis
├── server/              # Backend Express + tRPC
│   ├── routers.ts       # Procedures de API
│   └── db.ts            # Queries do banco
├── drizzle/             # Migrações do banco
├── scripts/             # Scripts de coleta de logs
├── install.sh           # Script de instalação automática
└── SETUP.md             # Documentação detalhada
```

## Scripts de Coleta de Logs

### Linux
```bash
curl -X POST http://seu-servidor:3000/api/trpc/logs.ingest \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": 1,
    "level": "info",
    "message": "Log de teste",
    "source": "syslog"
  }'
```

### Windows (PowerShell)
```powershell
$body = @{
    serverId = 1
    level = "info"
    message = "Log do Windows"
    source = "eventlog"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://seu-servidor:3000/api/trpc/logs.ingest" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Mikrotik
```
/system script add name=log-sender source={
  :local url "http://seu-servidor:3000/api/trpc/logs.ingest"
  :local message [/log get message]
  /tool fetch url=$url method=post http-data="serverId=1&level=info&message=$message&source=syslog"
}
/system scheduler add name=log-scheduler interval=1m on-event="/system script run log-sender"
```

## Configuração de Servidores

1. Acesse **http://localhost:3000/servers**
2. Clique em "Criar Novo Servidor"
3. Defina:
   - **Nome**: Nome identificador do servidor
   - **IP** (opcional): Se deixar em branco, aceita logs de qualquer IP
   - **Tipo**: Linux, Windows, Mikrotik, etc.

## Gerenciar API Keys

1. Acesse **http://localhost:3000/settings**
2. Selecione um servidor
3. Clique em "Criar Nova API Key"
4. Copie a chave e use em seus scripts

## Buscar Logs

1. Acesse **http://localhost:3000/logs**
2. Selecione um servidor
3. Use filtros:
   - **Nível**: debug, info, warning, error, critical
   - **Fonte**: syslog, eventlog, api, custom
   - **Data**: Intervalo de datas
   - **Texto**: Busca por palavra-chave

## Banco de Dados

As credenciais são geradas automaticamente e salvas em `.env`:

```
DATABASE_URL=mysql://log_central_user:SENHA_ALEATORIA@localhost:3306/log_centralizado
```

Para acessar manualmente:

```bash
mysql -u log_central_user -p -D log_centralizado
```

## Troubleshooting

### Erro: "MySQL not found"
```bash
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

### Erro: "Port 3000 already in use"
```bash
# Encontrar processo usando porta 3000
lsof -i :3000

# Matar processo
kill -9 <PID>
```

### Erro: "Node version too old"
O script detecta e reinstala automaticamente. Se precisar manualmente:

```bash
sudo apt-get remove -y nodejs npm
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Suporte

Para reportar problemas: https://github.com/fadv-tech/Log-Central/issues

## Licença

MIT
