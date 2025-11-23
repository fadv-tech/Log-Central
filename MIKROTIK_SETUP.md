# Configuração do Mikrotik para Log Central

## Visão Geral

Este guia mostra como configurar um Mikrotik RouterOS para enviar logs para o Log Central via HTTP POST.

**Pré-requisitos:**
- Mikrotik RouterOS v6.48+ ou v7.x
- Acesso ao WebFig ou SSH
- IP do servidor Log Central (ex: 204.12.229.251)
- Porta do servidor (padrão: 3000)

---

## Opção 1: Usando Script Scheduler (Recomendado)

### Passo 1: Criar Script para Enviar Logs

Acesse o Mikrotik via SSH ou WebFig e execute os seguintes comandos:

```
/system script add name=send-logs-to-central owner=admin policy=ftp,read,write,policy,test,winbox,password,sniff,sensitive,api,romon,dude,tikapp source={
:local logServerIP "204.12.229.251"
:local logServerPort "3000"
:local serverId "1"
:local apiKey "your-api-key-here"
:local logLevel "info"

# Obter últimos 100 logs do buffer
/log print follow=no numbers=0..99 as-value > /tmp/logs.txt

# Ler arquivo de logs
:local logContent [/file get [find name="/tmp/logs.txt"] contents]

# Enviar para Log Central
/tool fetch url="http://$logServerIP:$logServerPort/api/trpc/logs.ingest" \
  method=post \
  http-header-field="Content-Type: application/json" \
  http-data="{\"apiKey\":\"$apiKey\",\"timestamp\":$[time],\"level\":\"$logLevel\",\"source\":\"mikrotik\",\"message\":\"$logContent\"}" \
  dst-path="/tmp/response.txt"

# Limpar arquivo temporário
/file remove "/tmp/logs.txt"
/file remove "/tmp/response.txt"
}
```

### Passo 2: Agendar Script para Executar Periodicamente

```
/system scheduler add name=send-logs-scheduler on-event=send-logs-to-central interval=5m disabled=no
```

**Explicação:**
- `interval=5m` - Executa a cada 5 minutos
- Você pode ajustar para: `1m`, `10m`, `1h`, etc.

### Passo 3: Testar Script Manualmente

```
/system script run send-logs-to-central
```

Verifique se o log foi enviado consultando o arquivo de logs do servidor:

```bash
tail -f logs/app-$(date +%Y-%m-%d).log | grep "mikrotik"
```

---

## Opção 2: Usando Syslog (Alternativa)

Se o seu Mikrotik suporta syslog, você pode configurar assim:

### Passo 1: Configurar Syslog

```
/system logging add topics=info action=remote remote=204.12.229.251
```

**Nota:** Isso requer que você tenha um servidor syslog rodando na porta 514. O Log Central não suporta syslog nativamente, então a Opção 1 é recomendada.

---

## Opção 3: Usando Netflow (Avançado)

Para monitorar tráfego de rede em tempo real:

```
/ip traffic-flow set enabled=yes
/ip traffic-flow target add target-address=204.12.229.251 target-port=3000 version=9
```

---

## Configuração Detalhada (Passo a Passo)

### Via WebFig (Interface Web)

1. **Abra o WebFig:**
   - Acesse `http://<ip-do-mikrotik>:80` no navegador
   - Faça login com suas credenciais

2. **Vá para System > Scripts:**
   - Clique em "New"
   - Nome: `send-logs-to-central`
   - Cole o script do Passo 1

3. **Vá para System > Scheduler:**
   - Clique em "New"
   - Nome: `send-logs-scheduler`
   - On Event: `send-logs-to-central`
   - Interval: `5m`
   - Clique em "OK"

### Via SSH

1. **Conecte via SSH:**
   ```bash
   ssh admin@<ip-do-mikrotik>
   ```

2. **Cole os comandos dos Passos 1 e 2 acima**

3. **Verifique se foi criado:**
   ```
   /system script print
   /system scheduler print
   ```

---

## Variáveis Importantes

Edite estas variáveis no script conforme necessário:

| Variável | Exemplo | Descrição |
|----------|---------|-----------|
| `logServerIP` | `204.12.229.251` | IP do servidor Log Central |
| `logServerPort` | `3000` | Porta do servidor (padrão 3000) |
| `serverId` | `1` | ID do servidor no Log Central |
| `apiKey` | `a1b2c3d4...` | API Key gerada no Log Central |
| `logLevel` | `info`, `warning`, `error` | Nível do log |
| `interval` | `5m` | Intervalo de envio (1m, 5m, 10m, 1h) |

---

## Obter API Key

1. **Acesse o Log Central:**
   - Abra `http://204.12.229.251:3000`

2. **Vá para Configurações:**
   - Clique em "Configurações" no menu

3. **Selecione o Servidor Mikrotik:**
   - Escolha o servidor do Mikrotik na lista

4. **Gere uma API Key:**
   - Clique em "Gerar Nova Chave"
   - Nome: `Mikrotik Logs`
   - Copie a chave gerada

5. **Substitua no script:**
   - Abra o script `send-logs-to-central`
   - Substitua `your-api-key-here` pela chave copiada

---

## Testando a Configuração

### Teste 1: Executar Script Manualmente

```
/system script run send-logs-to-central
```

Você deve ver uma resposta como:

```
success: true
```

### Teste 2: Verificar Logs no Servidor

No servidor Log Central, execute:

```bash
# Ver últimos logs
tail -f logs/app-$(date +%Y-%m-%d).log

# Buscar logs do Mikrotik
grep "mikrotik" logs/app-*.log

# Contar requisições do Mikrotik
grep "mikrotik" logs/app-*.log | wc -l
```

### Teste 3: Verificar via API

```bash
curl "http://204.12.229.251:3000/api/trpc/logs.search?input=%7B%22source%22%3A%22mikrotik%22%7D" | jq .
```

---

## Troubleshooting

### Problema: "Connection refused"

**Causa:** Servidor Log Central não está rodando ou IP/porta incorretos

**Solução:**
```bash
# Verificar se servidor está rodando
curl http://204.12.229.251:3000/health

# Se não responder, reiniciar servidor
cd /home/ubuntu/Log-Central
pnpm dev
```

### Problema: "Invalid API Key"

**Causa:** API Key expirada ou incorreta

**Solução:**
1. Gere uma nova API Key no Log Central
2. Atualize o script com a nova chave
3. Execute novamente

### Problema: "IP not allowed"

**Causa:** Servidor tem restrição de IP

**Solução:**
1. No Log Central, vá para Configurações
2. Selecione o servidor Mikrotik
3. Deixe o campo "IP" vazio para aceitar qualquer IP
4. Ou configure o IP correto do Mikrotik

### Problema: Script não está executando

**Causa:** Scheduler desabilitado ou script com erro

**Solução:**
```
# Verificar se scheduler está ativado
/system scheduler print

# Se disabled=true, ativar
/system scheduler enable send-logs-scheduler

# Verificar logs de erro
/log print where topics~"script"
```

### Problema: Muitos logs sendo enviados

**Causa:** Intervalo muito curto ou muitos logs

**Solução:**
```
# Aumentar intervalo
/system scheduler set send-logs-scheduler interval=30m

# Ou filtrar apenas logs importantes
# Editar script para enviar apenas level=error
```

---

## Monitoramento

### Ver Status do Scheduler

```
/system scheduler print
```

Procure por `send-logs-scheduler` e verifique:
- `disabled=no` (deve estar ativado)
- `run-count` (número de vezes que executou)
- `last-started` (última vez que executou)

### Ver Histórico de Execução

```
/log print where topics~"scheduler"
```

### Verificar Requisições Enviadas

No servidor Log Central:

```bash
# Contar requisições do Mikrotik
grep "POST.*logs.ingest" logs/app-*.log | wc -l

# Ver última requisição
grep "POST.*logs.ingest" logs/app-*.log | tail -1 | jq .
```

---

## Otimizações

### Enviar Apenas Logs Importantes

Edite o script para filtrar por nível:

```
# Modificar a linha de envio para incluir apenas errors
/log print follow=no numbers=0..99 where level=error as-value > /tmp/logs.txt
```

### Comprimir Logs Antes de Enviar

Para economizar banda:

```
# Usar gzip para comprimir (se disponível)
/tool fetch url="http://$logServerIP:$logServerPort/api/trpc/logs.ingest" \
  method=post \
  http-header-field="Content-Type: application/json" \
  http-header-field="Content-Encoding: gzip" \
  http-data="{...}"
```

### Enviar Logs em Batch

Para melhor performance, agrupar múltiplos logs:

```
# Script avançado que envia lotes de 50 logs
:local batchSize 50
:local offset 0

:while ($offset < 1000) do={
  /log print follow=no numbers=$offset..($offset + $batchSize) as-value > /tmp/logs.txt
  # Enviar batch...
  :set offset ($offset + $batchSize)
}
```

---

## Exemplo Completo: Script Avançado

```
/system script add name=send-logs-advanced owner=admin policy=ftp,read,write,policy,test,winbox,password,sniff,sensitive,api,romon,dude,tikapp source={
:local logServerIP "204.12.229.251"
:local logServerPort "3000"
:local serverId "1"
:local apiKey "your-api-key-here"

# Configurações
:local batchSize 50
:local maxLogs 500
:local offset 0
:local totalSent 0

# Loop para enviar em lotes
:while ($offset < $maxLogs) do={
  # Obter logs
  /log print follow=no numbers=$offset..($offset + $batchSize) as-value > /tmp/batch.txt
  
  # Ler conteúdo
  :local batchContent [/file get [find name="/tmp/batch.txt"] contents]
  
  # Enviar para servidor
  :do {
    /tool fetch url="http://$logServerIP:$logServerPort/api/trpc/logs.ingest" \
      method=post \
      http-header-field="Content-Type: application/json" \
      http-data="{\"apiKey\":\"$apiKey\",\"timestamp\":$[time],\"level\":\"info\",\"source\":\"mikrotik-batch\",\"message\":\"$batchContent\"}" \
      dst-path="/tmp/response.txt" \
      timeout=10s
    
    :set totalSent ($totalSent + $batchSize)
  } on-error={
    :log error "Failed to send logs batch at offset $offset"
  }
  
  # Próximo lote
  :set offset ($offset + $batchSize)
  :delay 1s
}

# Limpar arquivos temporários
/file remove "/tmp/batch.txt"
/file remove "/tmp/response.txt"

:log info "Sent $totalSent logs to Log Central"
}
```

---

## Referências

- [Mikrotik Script Documentation](https://wiki.mikrotik.com/wiki/Manual:Scripting)
- [Mikrotik Logging](https://wiki.mikrotik.com/wiki/Manual:System/Logging)
- [Mikrotik Scheduler](https://wiki.mikrotik.com/wiki/Manual:System/Scheduler)
- [Mikrotik Tool Fetch](https://wiki.mikrotik.com/wiki/Manual:Tools/Fetch)

---

## Suporte

Se encontrar problemas:

1. **Verifique a conectividade:**
   ```
   /ping 204.12.229.251
   ```

2. **Teste a requisição manualmente:**
   ```
   /tool fetch url="http://204.12.229.251:3000/health" dst-path="/tmp/health.txt"
   /file print where name="/tmp/health.txt"
   ```

3. **Verifique os logs do servidor:**
   ```bash
   tail -f logs/app-$(date +%Y-%m-%d).log
   ```

4. **Consulte a documentação do Log Central:**
   - API: https://github.com/fadv-tech/Log-Central/blob/main/API_RESPONSES.md
   - Performance: https://github.com/fadv-tech/Log-Central/blob/main/PERFORMANCE.md
