##############################################################################
# Log Collector para Windows
# Coleta logs do Event Viewer e envia para o servidor centralizado
##############################################################################

# Configurações
$LogServer = "http://seu-servidor:3000/api/trpc/logs.ingest"
$ApiKey = "sua-api-key-aqui"
$EventLogName = "System"
$StateFile = "$env:TEMP\log-collector-state.txt"
$BatchSize = 50

# Criar arquivo de estado se não existir
if (-not (Test-Path $StateFile)) {
    "0" | Out-File -FilePath $StateFile -Encoding UTF8
}

# Função para enviar log
function Send-Log {
    param(
        [long]$Timestamp,
        [string]$Level,
        [string]$Message,
        [string]$Source
    )
    
    $json = @{
        apiKey = $ApiKey
        timestamp = $Timestamp
        level = $Level
        source = $Source
        message = $Message
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri $LogServer `
            -Method Post `
            -ContentType "application/json" `
            -Body $json `
            -TimeoutSec 10 | Out-Null
    } catch {
        Write-Host "Erro ao enviar log: $_"
    }
}

# Função para determinar nível de log
function Get-LogLevel {
    param([string]$EventType)
    
    switch ($EventType) {
        "Error" { return "error" }
        "Warning" { return "warning" }
        "Information" { return "info" }
        "SuccessAudit" { return "info" }
        "FailureAudit" { return "error" }
        default { return "debug" }
    }
}

# Processar logs
function Process-Logs {
    $lastEventId = [int](Get-Content -Path $StateFile -ErrorAction SilentlyContinue)
    $count = 0
    
    # Obter eventos do Event Log
    $events = Get-EventLog -LogName $EventLogName -Newest 1000 | Where-Object { $_.EventID -gt $lastEventId }
    
    foreach ($event in $events) {
        if ($count -ge $BatchSize) {
            break
        }
        
        $timestamp = [long]($event.TimeGenerated.ToUniversalTime() - (Get-Date -Date "1970-01-01")).TotalMilliseconds
        $level = Get-LogLevel -EventType $event.Type
        $message = $event.Message -replace "`r`n", " " | Select-Object -First 500
        
        Send-Log -Timestamp $timestamp -Level $level -Message $message -Source "eventlog"
        
        $count++
        $lastEventId = $event.EventID
    }
    
    # Atualizar estado
    $lastEventId | Out-File -FilePath $StateFile -Encoding UTF8
}

# Executar
Process-Logs

Write-Host "Log collector executado com sucesso"
