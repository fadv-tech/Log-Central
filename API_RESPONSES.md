# Respostas da API - Sucesso e Erro

## Formato de Resposta

Todas as respostas da API seguem o padrão tRPC com JSON estruturado.

### Resposta de Sucesso (HTTP 200)

```json
{
  "result": {
    "data": {
      // Dados da resposta
    }
  }
}
```

### Resposta de Erro (HTTP 400 ou 500)

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Descrição do erro",
    "data": {
      "code": "INTERNAL_SERVER_ERROR",
      "httpStatus": 500,
      "path": "logs.ingest"
    }
  }
}
```

---

## Endpoints e Respostas

### 1. Ingestão de Logs

**Endpoint:** `POST /api/trpc/logs.ingest`

#### Requisição (Sucesso)

```bash
curl -X POST http://localhost:3000/api/trpc/logs.ingest \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": 1,
    "timestamp": 1700000000000,
    "level": "error",
    "source": "application",
    "message": "Database connection failed",
    "metadata": "{\"userId\": 123}",
    "tags": "database,critical"
  }'
```

#### Resposta (Sucesso - HTTP 200)

```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

#### Requisição (Erro - API Key Inválida)

```bash
curl -X POST http://localhost:3000/api/trpc/logs.ingest \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "invalid-key-123",
    "timestamp": 1700000000000,
    "level": "error",
    "source": "application",
    "message": "Test log"
  }'
```

#### Resposta (Erro - HTTP 400)

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid or inactive API key",
    "data": {
      "code": "BAD_REQUEST",
      "httpStatus": 400,
      "path": "logs.ingest"
    }
  }
}
```

#### Requisição (Erro - IP Não Permitido)

```bash
curl -X POST http://localhost:3000/api/trpc/logs.ingest \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": 1,
    "clientIP": "192.168.1.100",
    "timestamp": 1700000000000,
    "level": "error",
    "source": "application",
    "message": "Test log"
  }'
```

#### Resposta (Erro - IP Não Permitido - HTTP 400)

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "IP 192.168.1.100 is not allowed for this server",
    "data": {
      "code": "BAD_REQUEST",
      "httpStatus": 400,
      "path": "logs.ingest"
    }
  }
}
```

---

### 2. Buscar Logs

**Endpoint:** `GET /api/trpc/logs.search`

#### Requisição (Sucesso)

```bash
curl "http://localhost:3000/api/trpc/logs.search?input=%7B%22serverId%22%3A1%2C%22level%22%3A%22error%22%7D"
```

#### Resposta (Sucesso - HTTP 200)

```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "serverId": 1,
        "timestamp": 1700000000000,
        "level": "error",
        "source": "application",
        "message": "Database connection failed",
        "metadata": "{\"userId\": 123}",
        "tags": "database,critical",
        "createdAt": "2024-11-23T10:00:00.000Z"
      },
      {
        "id": 2,
        "serverId": 1,
        "timestamp": 1700000001000,
        "level": "error",
        "source": "system",
        "message": "Memory usage exceeded 90%",
        "metadata": null,
        "tags": "system,warning",
        "createdAt": "2024-11-23T10:00:01.000Z"
      }
    ]
  }
}
```

#### Requisição (Erro - Servidor Não Encontrado)

```bash
curl "http://localhost:3000/api/trpc/logs.search?input=%7B%22serverId%22%3A999%7D"
```

#### Resposta (Sucesso com Array Vazio - HTTP 200)

```json
{
  "result": {
    "data": []
  }
}
```

---

### 3. Criar Servidor

**Endpoint:** `POST /api/trpc/servers.create`

#### Requisição (Sucesso)

```bash
curl -X POST http://localhost:3000/api/trpc/servers.create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "hostname": "prod-01.example.com",
    "ipAddress": "192.168.1.10",
    "serverType": "linux",
    "description": "Main production server",
    "location": "Data Center A"
  }'
```

#### Resposta (Sucesso - HTTP 200)

```json
{
  "result": {
    "data": {
      "insertId": 35,
      "affectedRows": 1
    }
  }
}
```

#### Requisição (Erro - Nome Vazio)

```bash
curl -X POST http://localhost:3000/api/trpc/servers.create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "serverType": "linux"
  }'
```

#### Resposta (Sucesso - Servidor Criado com Nome Vazio - HTTP 200)

```json
{
  "result": {
    "data": {
      "insertId": 36,
      "affectedRows": 1
    }
  }
}
```

---

### 4. Listar Servidores

**Endpoint:** `GET /api/trpc/servers.list`

#### Requisição (Sucesso)

```bash
curl http://localhost:3000/api/trpc/servers.list
```

#### Resposta (Sucesso - HTTP 200)

```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "name": "Web Server",
        "hostname": "web-01.example.com",
        "ipAddress": "192.168.1.10",
        "serverType": "linux",
        "description": "Main web server",
        "location": "Data Center A",
        "isActive": 1,
        "lastHeartbeat": "2024-11-23T10:30:00.000Z",
        "createdAt": "2024-11-20T08:00:00.000Z",
        "updatedAt": "2024-11-23T10:30:00.000Z"
      },
      {
        "id": 2,
        "name": "Database Server",
        "hostname": "db-01.example.com",
        "ipAddress": null,
        "serverType": "linux",
        "description": "Main database server",
        "location": "Data Center B",
        "isActive": 1,
        "lastHeartbeat": "2024-11-23T10:29:00.000Z",
        "createdAt": "2024-11-20T08:00:00.000Z",
        "updatedAt": "2024-11-23T10:29:00.000Z"
      }
    ]
  }
}
```

---

### 5. Criar API Key

**Endpoint:** `POST /api/trpc/apiKeys.create`

#### Requisição (Sucesso)

```bash
curl -X POST http://localhost:3000/api/trpc/apiKeys.create \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": 1,
    "name": "Production API Key"
  }'
```

#### Resposta (Sucesso - HTTP 200)

```json
{
  "result": {
    "data": {
      "success": true,
      "key": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
    }
  }
}
```

#### Requisição (Erro - Servidor Não Encontrado)

```bash
curl -X POST http://localhost:3000/api/trpc/apiKeys.create \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": 0,
    "name": "Test Key"
  }'
```

#### Resposta (Erro - HTTP 400)

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "serverId is required",
    "data": {
      "code": "BAD_REQUEST",
      "httpStatus": 400,
      "path": "apiKeys.create"
    }
  }
}
```

---

### 6. Listar API Keys

**Endpoint:** `GET /api/trpc/apiKeys.listByServer`

#### Requisição (Sucesso)

```bash
curl "http://localhost:3000/api/trpc/apiKeys.listByServer?input=%7B%22serverId%22%3A1%7D"
```

#### Resposta (Sucesso - HTTP 200)

```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "serverId": 1,
        "key": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
        "name": "Production API Key",
        "isActive": 1,
        "lastUsed": "2024-11-23T10:30:00.000Z",
        "createdAt": "2024-11-23T09:00:00.000Z"
      }
    ]
  }
}
```

---

### 7. Criar Log Source

**Endpoint:** `POST /api/trpc/logSources.create`

#### Requisição (Sucesso)

```bash
curl -X POST http://localhost:3000/api/trpc/logSources.create \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": 1,
    "sourceType": "syslog",
    "sourceConfig": "{\"port\": 514}"
  }'
```

#### Resposta (Sucesso - HTTP 200)

```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

#### Requisição (Erro - Tipo de Fonte Vazio)

```bash
curl -X POST http://localhost:3000/api/trpc/logSources.create \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": 1,
    "sourceType": ""
  }'
```

#### Resposta (Erro - HTTP 400)

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "sourceType is required",
    "data": {
      "code": "BAD_REQUEST",
      "httpStatus": 400,
      "path": "logSources.create"
    }
  }
}
```

---

## Códigos de Erro Comuns

| Código | HTTP | Descrição |
|--------|------|-----------|
| `BAD_REQUEST` | 400 | Entrada inválida ou faltando parâmetros obrigatórios |
| `UNAUTHORIZED` | 401 | Autenticação falhou (não aplicável neste sistema) |
| `FORBIDDEN` | 403 | Acesso negado (não aplicável neste sistema) |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `INTERNAL_SERVER_ERROR` | 500 | Erro interno do servidor |
| `TOO_MANY_REQUESTS` | 429 | Rate limit excedido |

---

## Logging de Requisições e Respostas

Todas as requisições e respostas são registradas automaticamente em `./logs/app-YYYY-MM-DD.log`:

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

---

## Exemplos de Integração

### Python

```python
import requests
import json

# Ingerir log
response = requests.post(
    'http://localhost:3000/api/trpc/logs.ingest',
    json={
        'serverId': 1,
        'timestamp': int(time.time() * 1000),
        'level': 'error',
        'source': 'application',
        'message': 'Database connection failed'
    }
)

if response.status_code == 200:
    data = response.json()
    if 'result' in data:
        print("Log ingested successfully")
    else:
        print("Error:", data['error']['message'])
else:
    print("HTTP Error:", response.status_code)
```

### cURL

```bash
# Ingerir log
curl -X POST http://localhost:3000/api/trpc/logs.ingest \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": 1,
    "timestamp": '$(date +%s)'000,
    "level": "error",
    "source": "application",
    "message": "Test error message"
  }' | jq .

# Buscar logs
curl "http://localhost:3000/api/trpc/logs.search?input=%7B%22serverId%22%3A1%7D" | jq .
```

### Bash

```bash
#!/bin/bash

# Função para ingerir log
ingest_log() {
  local server_id=$1
  local level=$2
  local message=$3
  
  curl -s -X POST http://localhost:3000/api/trpc/logs.ingest \
    -H "Content-Type: application/json" \
    -d "{
      \"serverId\": $server_id,
      \"timestamp\": $(date +%s)000,
      \"level\": \"$level\",
      \"source\": \"bash\",
      \"message\": \"$message\"
    }" | jq .
}

# Usar função
ingest_log 1 "error" "Backup failed"
```

---

## Health Check

**Endpoint:** `GET /health`

#### Requisição

```bash
curl http://localhost:3000/health
```

#### Resposta (HTTP 200)

```json
{
  "status": "ok",
  "timestamp": "2024-11-23T10:30:45.123Z"
}
```
