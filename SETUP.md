# Log Centralizado - Guia de Instalação e Uso

## 📋 Visão Geral

**Log Centralizado** é uma aplicação fullstack para coletar, armazenar e visualizar logs de múltiplos servidores (Linux, Windows, Mikrotik e outros) em um único lugar.

## 🚀 Instalação

### Pré-requisitos

- **Node.js** 18+ e **pnpm**
- **MySQL** 5.7+ ou **MariaDB** 10.3+
- **Ubuntu/Linux** para o servidor principal

### 1. Clonar e Instalar Dependências

```bash
cd /home/ubuntu/log_centralizado
pnpm install
```

### 2. Configurar Banco de Dados

O banco de dados já está configurado automaticamente. Para verificar a conexão:

```bash
pnpm db:push
```

### 3. Iniciar o Servidor

```bash
pnpm dev
```

O servidor estará disponível em: `http://localhost:3000`

## 📊 Usando a Aplicação

### Dashboard

Acesse a página inicial para ver:
- Número de servidores conectados
- Total de logs nas últimas 24h
- Erros e logs críticos
- Lista de servidores ativos

### Busca de Logs

Na página **"Buscar Logs"** você pode:

1. **Selecionar um servidor** para filtrar logs
2. **Filtrar por nível**: debug, info, warning, error, critical
3. **Filtrar por fonte**: syslog, eventlog, api, custom
4. **Filtrar por data**: data inicial e final
5. **Buscar por texto**: procurar na mensagem do log
6. **Paginar resultados**: 10, 25, 50 ou 100 logs por página

### Gerenciamento de Servidores

Na página **"Servidores"** você pode:

1. **Criar novo servidor**: Nome, Hostname, IP, Tipo (Linux/Windows/Mikrotik)
2. **Visualizar status**: Ativo/Inativo
3. **Ver estatísticas**: Logs por servidor

### Configurações

Na página **"Configurações"** você pode:

1. **Gerar API Keys**: Crie chaves para cada servidor
2. **Visualizar instruções**: Como integrar seus servidores
3. **Copiar chaves**: Para usar nos scripts de coleta

## 🔧 Configurar Coleta de Logs

### Para Linux

1. Edite o arquivo `/scripts/linux-log-collector.sh`:

```bash
LOG_SERVER="http://seu-servidor:3000/api/trpc/logs.ingest"
API_KEY="sua-api-key-aqui"
```

2. Torne o script executável:

```bash
chmod +x /scripts/linux-log-collector.sh
```

3. Adicione ao crontab para executar a cada 5 minutos:

```bash
crontab -e
```

Adicione a linha:

```cron
*/5 * * * * /home/ubuntu/log_centralizado/scripts/linux-log-collector.sh
```

### Para Windows

1. Edite o arquivo `scripts/windows-log-collector.ps1`:

```powershell
$LogServer = "http://seu-servidor:3000/api/trpc/logs.ingest"
$ApiKey = "sua-api-key-aqui"
```

2. Execute o script manualmente ou via Task Scheduler:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\path\to\windows-log-collector.ps1"
```

3. Para executar automaticamente a cada 5 minutos, crie uma tarefa agendada no Windows Task Scheduler.

### Para Mikrotik

1. Edite o arquivo `scripts/mikrotik-log-collector.rsc`:

```
:local logServer "http://seu-servidor:3000/api/trpc/logs.ingest"
:local apiKey "sua-api-key-aqui"
```

2. Copie o conteúdo do script e execute via SSH:

```bash
ssh admin@seu-mikrotik-ip < scripts/mikrotik-log-collector.rsc
```

3. Para executar automaticamente, adicione um agendador no Mikrotik:

```
/system scheduler add name="log-collector" on-event="/import scripts/mikrotik-log-collector.rsc" interval=5m
```

## 📡 API de Ingestão

### Endpoint

```
POST http://seu-servidor:3000/api/trpc/logs.ingest
```

### Formato de Requisição

```json
{
  "apiKey": "sua-api-key-aqui",
  "timestamp": 1700000000000,
  "level": "info",
  "source": "syslog",
  "message": "Seu log aqui",
  "metadata": "{}",
  "tags": "tag1,tag2"
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| apiKey | string | Sim | Sua API Key |
| timestamp | number | Não | Unix timestamp em ms (padrão: agora) |
| level | string | Não | debug, info, warning, error, critical (padrão: info) |
| source | string | Não | Origem do log (padrão: unknown) |
| message | string | Sim | Mensagem do log |
| metadata | string | Não | JSON string com dados adicionais |
| tags | string | Não | Tags separadas por vírgula |

### Exemplo com cURL

```bash
curl -X POST http://seu-servidor:3000/api/trpc/logs.ingest \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sua-api-key-aqui",
    "timestamp": 1700000000000,
    "level": "error",
    "source": "syslog",
    "message": "Erro crítico no sistema",
    "metadata": "{\"service\": \"nginx\", \"pid\": 1234}",
    "tags": "production,critical"
  }'
```

## 🔐 Segurança

### API Keys

- Cada servidor tem suas próprias API Keys
- As chaves são geradas aleatoriamente e armazenadas com hash no banco
- Nunca compartilhe suas chaves
- Você pode gerar múltiplas chaves por servidor

### Recomendações

1. Use HTTPS em produção (configure um reverse proxy com SSL)
2. Mantenha as API Keys seguras
3. Implemente firewall para restringir acesso ao servidor
4. Faça backup regular do banco de dados MySQL

## 📈 Escalabilidade

Para grandes volumes de logs:

1. **Aumentar limite de conexões MySQL**:

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Altere max_connections para um valor maior (ex: 1000)
```

2. **Adicionar índices adicionais**:

```sql
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_source ON logs(source);
```

3. **Implementar retenção de logs**:

```sql
DELETE FROM logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

Verifique se o MySQL está rodando:

```bash
sudo systemctl status mysql
```

### Erro: "API Key inválida"

1. Verifique se a chave foi copiada corretamente
2. Certifique-se de que a chave está ativa
3. Gere uma nova chave se necessário

### Logs não aparecem

1. Verifique se o servidor está registrado
2. Confirme que a API Key está correta
3. Verifique os logs do servidor: `pnpm dev`

## 📚 Estrutura do Projeto

```
log_centralizado/
├── client/                 # Frontend React
│   └── src/
│       ├── pages/         # Páginas (Dashboard, Logs, Servers, Settings)
│       ├── components/    # Componentes reutilizáveis
│       └── lib/           # Configuração tRPC
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # Procedures tRPC
│   ├── db.ts              # Funções de banco de dados
│   └── _core/             # Configuração interna
├── drizzle/               # Schema e migrações
├── scripts/               # Scripts de coleta de logs
└── SETUP.md              # Este arquivo
```

## 🤝 Suporte

Para problemas ou dúvidas, verifique:

1. Os logs do servidor: `pnpm dev`
2. O console do navegador (F12)
3. O banco de dados MySQL

## 📝 Licença

Este projeto é fornecido como-está para uso interno.

---

**Última atualização**: Novembro 2024
