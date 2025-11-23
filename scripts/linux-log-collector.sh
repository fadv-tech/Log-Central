#!/bin/bash

##############################################################################
# Log Collector para Linux
# Coleta logs do syslog e envia para o servidor centralizado
##############################################################################

# Configurações
LOG_SERVER="http://seu-servidor:3000/api/trpc/logs.ingest"
API_KEY="sua-api-key-aqui"
SYSLOG_FILE="/var/log/syslog"
STATE_FILE="/tmp/log-collector-state.txt"
BATCH_SIZE=50

# Criar arquivo de estado se não existir
if [ ! -f "$STATE_FILE" ]; then
    echo "0" > "$STATE_FILE"
fi

# Função para enviar log
send_log() {
    local timestamp=$1
    local level=$2
    local message=$3
    local source=$4
    
    # Converter timestamp para milissegundos
    local timestamp_ms=$((timestamp * 1000))
    
    # Preparar JSON
    local json=$(cat <<EOF
{
    "apiKey": "$API_KEY",
    "timestamp": $timestamp_ms,
    "level": "$level",
    "source": "$source",
    "message": "$message"
}
EOF
)
    
    # Enviar para o servidor
    curl -s -X POST "$LOG_SERVER" \
        -H "Content-Type: application/json" \
        -d "$json" > /dev/null 2>&1
}

# Função para determinar nível de log
get_log_level() {
    local message=$1
    
    if [[ $message =~ [Cc]ritical|[Ee]mergency ]]; then
        echo "critical"
    elif [[ $message =~ [Ee]rror|[Ff]ail ]]; then
        echo "error"
    elif [[ $message =~ [Ww]arn ]]; then
        echo "warning"
    elif [[ $message =~ [Ii]nfo ]]; then
        echo "info"
    else
        echo "debug"
    fi
}

# Processar logs
process_logs() {
    local last_line=$(cat "$STATE_FILE")
    local current_line=0
    local count=0
    
    while IFS= read -r line; do
        current_line=$((current_line + 1))
        
        # Pular linhas já processadas
        if [ $current_line -le $last_line ]; then
            continue
        fi
        
        # Extrair timestamp (formato syslog)
        local timestamp=$(date -d "$(echo $line | cut -d' ' -f1-3)" +%s 2>/dev/null || date +%s)
        
        # Extrair nível e mensagem
        local level=$(get_log_level "$line")
        local message=$(echo "$line" | cut -d: -f2- | sed 's/^ *//')
        
        # Enviar log
        send_log "$timestamp" "$level" "$message" "syslog"
        
        count=$((count + 1))
        
        # Limitar batch
        if [ $count -ge $BATCH_SIZE ]; then
            break
        fi
    done < "$SYSLOG_FILE"
    
    # Atualizar estado
    echo "$current_line" > "$STATE_FILE"
}

# Executar
process_logs

echo "Log collector executado com sucesso"
