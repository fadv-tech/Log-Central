# Performance e Escalabilidade

## Como o Sistema Lida com Requisições Simultâneas

### 1. Connection Pooling (MySQL)

O sistema implementa **connection pooling** com limite de 50 conexões simultâneas:

```javascript
const POOL_CONFIG = {
  connectionLimit: 50,        // Máximo de conexões simultâneas
  waitForConnections: true,   // Aguarda conexão disponível
  queueLimit: 0,              // Sem limite de fila
  enableKeepAlive: true,      // Mantém conexões vivas
};
```

**Benefícios:**
- ✅ Reutiliza conexões (não cria nova a cada requisição)
- ✅ Evita "connection exhaustion"
- ✅ Reduz latência de conexão
- ✅ Suporta até 50 requisições simultâneas ao banco

### 2. Rate Limiting

Implementado em dois níveis:

#### API Geral
```javascript
// 1000 requisições por 15 minutos por IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});
```

#### Log Ingest (Alta Volume)
```javascript
// 10000 requisições por minuto (para coleta de logs)
const logIngestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10000,
});
```

**Benefícios:**
- ✅ Protege contra abuso/DDoS
- ✅ Garante QoS (Quality of Service)
- ✅ Permite alta volume de logs (10k/min)
- ✅ Retorna headers `RateLimit-*` para cliente ajustar

### 3. Compressão de Respostas

```javascript
app.use(compression()); // Gzip automático
```

**Benefícios:**
- ✅ Reduz tamanho de resposta em ~70%
- ✅ Menor uso de banda
- ✅ Resposta mais rápida
- ✅ Automático para cliente que suporta gzip

### 4. Logging Completo de Requisições e Respostas

Todas as requisições e respostas são registradas em arquivo:

```
logs/
├── app-2024-11-23.log
├── app-2024-11-22.log
└── app-2024-11-21.log
```

**Formato do Log:**
```json
{
  "timestamp": "2024-11-23T10:30:45.123Z",
  "level": "INFO",
  "method": "POST",
  "path": "/api/trpc/logs.ingest",
  "statusCode": 200,
  "duration": 45,
  "message": "Response sent",
  "ip": "192.168.1.100"
}
```

**Tipos de Log:**
- ✅ **INFO** - Requisições recebidas e respostas bem-sucedidas
- ✅ **ERROR** - Erros com stack trace
- ✅ **WARN** - Avisos e eventos importantes
- ✅ **DEBUG** - Informações de debug (desenvolvimento)

**Limpeza Automática:**
- Logs com mais de 7 dias são removidos automaticamente
- Executado no startup do servidor

### 5. Graceful Shutdown

```javascript
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

**Benefícios:**
- ✅ Fecha conexões do banco corretamente
- ✅ Não perde requisições em voo
- ✅ Timeout de 10 segundos para shutdown forçado
- ✅ Permite redeployment sem perda de dados

## Limites e Capacidade

### Requisições Simultâneas

| Métrica | Valor | Notas |
|---------|-------|-------|
| Conexões DB simultâneas | 50 | Limite do pool |
| Requisições API por 15min | 1000 | Rate limit geral |
| Requisições Log por minuto | 10000 | Rate limit log ingest |
| Fila de conexão | Ilimitada | Aguarda conexão disponível |
| Timeout de conexão | 30s | Padrão MySQL |

### Throughput Esperado

**Em um servidor Ubuntu padrão:**

- **Ingestão de logs**: ~2000-5000 logs/segundo
- **Busca de logs**: ~100-500 queries/segundo
- **Gerenciamento**: ~500 requisições/segundo

**Fatores que afetam:**
- Tamanho das mensagens de log
- Complexidade das queries de busca
- Velocidade do disco (SSD vs HDD)
- Recursos do servidor (CPU, RAM)

## Otimizações Implementadas

### Backend

1. **Connection Pooling** - Reutiliza conexões (50 simultâneas)
2. **Rate Limiting** - Protege contra abuso
3. **Compressão** - Reduz tamanho de resposta
4. **Logging Completo** - Registra todas as requisições/respostas
5. **Lazy Loading** - Carrega DB apenas quando necessário
6. **Índices no Banco** - Queries mais rápidas

### Frontend

1. **Code Splitting** - Carrega apenas código necessário
2. **Lazy Loading de Componentes** - Reduz bundle inicial
3. **Caching** - Armazena dados em cache local
4. **Debouncing** - Evita requisições desnecessárias

### Banco de Dados

```sql
-- Índices para performance
CREATE INDEX idx_logs_serverId ON logs(serverId);
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_apiKeys_serverId ON apiKeys(serverId);
CREATE INDEX idx_logStatistics_serverId_date ON logStatistics(serverId, date);
```

## Acessar Logs

### Últimas Linhas do Log

```bash
tail -f logs/app-$(date +%Y-%m-%d).log
```

### Buscar por Erro

```bash
grep "ERROR" logs/app-*.log
```

### Contar Requisições

```bash
grep "Response sent" logs/app-$(date +%Y-%m-%d).log | wc -l
```

### Latência Média

```bash
grep "Response sent" logs/app-$(date +%Y-%m-%d).log | \
  jq '.duration' | \
  awk '{sum+=$1; count++} END {print "Média:", sum/count, "ms"}'
```

## Escalabilidade Horizontal

Para suportar mais requisições, você pode:

### 1. Usar Load Balancer (Nginx)

```nginx
upstream log_central {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    listen 80;
    location / {
        proxy_pass http://log_central;
    }
}
```

### 2. Usar Redis para Cache

```javascript
// Cache de queries frequentes
const cache = new Redis();
const cachedLogs = await cache.get(`logs:${serverId}`);
```

### 3. Usar Replicação MySQL

```sql
-- Master-Slave replication
-- Reads vão para Slave, Writes para Master
```

### 4. Usar Elasticsearch para Logs

Para volume muito alto (>10k logs/segundo):

```javascript
// Elasticsearch para logs
// MySQL para metadados
// Redis para cache
```

## Monitoramento

### Health Check

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2024-11-23T10:00:00Z"}
```

### Métricas Importantes

1. **Latência de Resposta** - Deve estar < 100ms
2. **Taxa de Erro** - Deve estar < 0.1%
3. **Uso de Conexão DB** - Monitorar pool
4. **Tamanho do Banco** - Arquivar logs antigos
5. **Memória do Servidor** - Evitar OOM

## Troubleshooting

### "Too many connections"

```bash
# Aumentar limite do pool em server/db.ts
connectionLimit: 100  # Aumentar de 50 para 100
```

### "Rate limit exceeded"

```bash
# Aumentar limite em server/_core/index.ts
max: 2000  # Aumentar de 1000 para 2000
```

### Lentidão na Busca

```sql
-- Adicionar índices
ALTER TABLE logs ADD INDEX idx_search (serverId, timestamp, level);
```

### Banco Crescendo Muito

```sql
-- Arquivar logs antigos
DELETE FROM logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

## Recomendações

### Para Produção

1. ✅ Use SSD para banco de dados
2. ✅ Configure backup automático
3. ✅ Use Load Balancer (Nginx/HAProxy)
4. ✅ Monitore com Prometheus/Grafana
5. ✅ Configure alertas para alta latência
6. ✅ Archive logs antigos regularmente
7. ✅ Use HTTPS/TLS
8. ✅ Configure firewall
9. ✅ Monitore logs em `./logs`

### Para Alta Volume (>10k logs/seg)

1. ✅ Use Elasticsearch para logs
2. ✅ Use Redis para cache
3. ✅ Configure replicação MySQL
4. ✅ Use múltiplas instâncias (load balancer)
5. ✅ Considere Kubernetes para orquestração

## Referências

- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit)
- [MySQL Connection Pooling](https://github.com/mysqljs/mysql#pooling-connections)
- [Compression Middleware](https://github.com/expressjs/compression)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance-best-practices/)
