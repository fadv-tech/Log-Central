import fs from "fs";
import path from "path";

// Criar diretório de logs se não existir
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Arquivo de log
const logFile = path.join(logsDir, `app-${new Date().toISOString().split("T")[0]}.log`);

interface LogEntry {
  timestamp: string;
  level: "INFO" | "ERROR" | "WARN" | "DEBUG";
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  message: string;
  error?: string;
  ip?: string;
}

/**
 * Escrever log em arquivo e console
 */
export function writeLog(entry: LogEntry) {
  const logLine = JSON.stringify(entry);
  
  // Escrever em arquivo
  fs.appendFileSync(logFile, logLine + "\n");
  
  // Escrever em console (desenvolvimento)
  if (process.env.NODE_ENV === "development") {
    const color = {
      INFO: "\x1b[36m",    // Cyan
      ERROR: "\x1b[31m",   // Red
      WARN: "\x1b[33m",    // Yellow
      DEBUG: "\x1b[35m",   // Magenta
    }[entry.level];
    
    const reset = "\x1b[0m";
    const duration = entry.duration ? ` (${entry.duration}ms)` : "";
    const status = entry.statusCode ? ` [${entry.statusCode}]` : "";
    
    console.log(
      `${color}[${entry.timestamp}] ${entry.level}${reset} ${entry.method} ${entry.path}${status}${duration} - ${entry.message}`
    );
  }
}

/**
 * Log de requisição recebida
 */
export function logRequest(method: string, path: string, ip: string) {
  writeLog({
    timestamp: new Date().toISOString(),
    level: "INFO",
    method,
    path,
    message: "Request received",
    ip,
  });
}

/**
 * Log de resposta bem-sucedida
 */
export function logResponse(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  ip: string
) {
  writeLog({
    timestamp: new Date().toISOString(),
    level: "INFO",
    method,
    path,
    statusCode,
    duration,
    message: "Response sent",
    ip,
  });
}

/**
 * Log de erro
 */
export function logError(
  method: string,
  path: string,
  statusCode: number,
  error: Error | string,
  ip: string
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  writeLog({
    timestamp: new Date().toISOString(),
    level: "ERROR",
    method,
    path,
    statusCode,
    message: "Error occurred",
    error: errorMessage,
    ip,
  });
  
  if (errorStack) {
    fs.appendFileSync(logFile, `Stack: ${errorStack}\n`);
  }
}

/**
 * Log de aviso
 */
export function logWarn(message: string, details?: Record<string, any>) {
  writeLog({
    timestamp: new Date().toISOString(),
    level: "WARN",
    method: "N/A",
    path: "N/A",
    message,
  });
  
  if (details) {
    fs.appendFileSync(logFile, `Details: ${JSON.stringify(details)}\n`);
  }
}

/**
 * Log de debug
 */
export function logDebug(message: string, details?: Record<string, any>) {
  if (process.env.NODE_ENV === "development") {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "DEBUG",
      method: "N/A",
      path: "N/A",
      message,
    });
    
    if (details) {
      fs.appendFileSync(logFile, `Details: ${JSON.stringify(details)}\n`);
    }
  }
}

/**
 * Obter últimos N linhas do log
 */
export function getTailLog(lines: number = 100): string {
  try {
    const content = fs.readFileSync(logFile, "utf-8");
    const logLines = content.split("\n").filter(l => l.trim());
    return logLines.slice(-lines).join("\n");
  } catch {
    return "No logs available";
  }
}

/**
 * Limpar logs antigos (mais de 7 dias)
 */
export function cleanOldLogs(daysToKeep: number = 7) {
  try {
    const files = fs.readdirSync(logsDir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        logWarn(`Deleted old log file: ${file}`);
      }
    });
  } catch (error) {
    console.error("Error cleaning old logs:", error);
  }
}
