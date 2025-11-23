# Log Collector para Mikrotik
# Coleta logs e envia para o servidor centralizado
# Executar este script no Mikrotik via SSH ou WinBox

# Configurações
:local logServer "http://seu-servidor:3000/api/trpc/logs.ingest"
:local apiKey "sua-api-key-aqui"
:local batchSize 50

# Função para enviar log
:local sendLog do={
    :local timestamp [/system clock get date]
    :local level $1
    :local message $2
    :local source $3
    
    # Converter timestamp para milissegundos (simplificado)
    :local timestampMs ([/system clock get time] * 1000)
    
    # Preparar JSON
    :local json "{\"apiKey\":\"$apiKey\",\"timestamp\":$timestampMs,\"level\":\"$level\",\"source\":\"$source\",\"message\":\"$message\"}"
    
    # Enviar para o servidor
    /tool fetch url="$logServer" http-method=post http-header-field="Content-Type: application/json" http-data="$json" mode=http output=none
}

# Processar logs do sistema
:local logEntries [/log find]
:local count 0

:foreach entry in=$logEntries do={
    :if ($count >= $batchSize) do={
        :break
    }
    
    :local logData [/log get $entry]
    :local message ($logData->"message")
    :local level "info"
    
    # Determinar nível baseado na mensagem
    :if ([:find $message "error"] != nil) do={
        :set level "error"
    }
    :if ([:find $message "critical"] != nil) do={
        :set level "critical"
    }
    :if ([:find $message "warning"] != nil) do={
        :set level "warning"
    }
    
    # Enviar log
    [$sendLog $level $message "syslog"]
    
    :set count ($count + 1)
}

:put "Log collector executado com sucesso"
