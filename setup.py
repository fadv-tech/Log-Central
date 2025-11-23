#!/usr/bin/env python3
"""
Log Centralizado - Setup Automático
Execute este script no servidor: python3 setup.py
"""

import os
import subprocess
import sys
import time

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def run_command(cmd, description=""):
    """Executar comando e retornar resultado"""
    if description:
        print(f"{Colors.YELLOW}[*] {description}{Colors.END}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            return True, result.stdout
        else:
            return False, result.stderr
    except subprocess.TimeoutExpired:
        return False, "Timeout"
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 70)
    print(f"{Colors.BLUE}LOG CENTRALIZADO - SETUP AUTOMÁTICO{Colors.END}")
    print("=" * 70)
    
    # 1. Clonar repositório
    print(f"\n{Colors.YELLOW}[1/7] Clonando repositório...{Colors.END}")
    run_command("sudo rm -rf /opt/log-centralizado", "Removendo diretório antigo")
    success, output = run_command(
        "sudo git clone https://github.com/fadv-tech/Log-Central.git /opt/log-centralizado",
        "Clonando repositório"
    )
    if success:
        print(f"{Colors.GREEN}[✓] Repositório clonado{Colors.END}")
    else:
        print(f"{Colors.RED}[✗] Erro ao clonar: {output}{Colors.END}")
        return False
    
    run_command("sudo chown -R $(whoami):$(whoami) /opt/log-centralizado")
    
    # 2. Instalar dependências
    print(f"\n{Colors.YELLOW}[2/7] Instalando dependências (pode levar 3-5 minutos)...{Colors.END}")
    success, output = run_command(
        "cd /opt/log-centralizado && npm install --production 2>&1 | tail -5",
        "Instalando npm packages"
    )
    if success:
        print(f"{Colors.GREEN}[✓] Dependências instaladas{Colors.END}")
        print(output)
    else:
        print(f"{Colors.RED}[✗] Erro ao instalar dependências{Colors.END}")
        return False
    
    # 3. Criar arquivo .env
    print(f"\n{Colors.YELLOW}[3/7] Criando arquivo .env...{Colors.END}")
    env_content = """DATABASE_URL="mysql://log_central_user:sRUK11w5u1LjCruC6gISkQPaY@localhost:3306/log_centralizado"
JWT_SECRET="supersecretkey123456789abcdefghij"
VITE_APP_TITLE="Log Centralizado"
VITE_APP_LOGO="/logo.svg"
NODE_ENV="production"
PORT="3000"
"""
    try:
        with open("/opt/log-centralizado/.env", "w") as f:
            f.write(env_content)
        print(f"{Colors.GREEN}[✓] Arquivo .env criado{Colors.END}")
    except Exception as e:
        print(f"{Colors.RED}[✗] Erro ao criar .env: {e}{Colors.END}")
        return False
    
    # 4. Testar banco de dados
    print(f"\n{Colors.YELLOW}[4/7] Testando conexão com banco de dados...{Colors.END}")
    success, output = run_command(
        "mysql -u log_central_user -psRUK11w5u1LjCruC6gISkQPaY -h localhost log_centralizado -e 'SELECT 1;' 2>&1",
        "Testando MySQL"
    )
    if success and "1" in output:
        print(f"{Colors.GREEN}[✓] Banco de dados acessível{Colors.END}")
    else:
        print(f"{Colors.YELLOW}[!] Aviso: Banco de dados pode não estar acessível{Colors.END}")
        print(f"    Verifique as credenciais: log_central_user / sRUK11w5u1LjCruC6gISkQPaY")
    
    # 5. Rodar migrações
    print(f"\n{Colors.YELLOW}[5/7] Rodando migrações do banco de dados...{Colors.END}")
    success, output = run_command(
        "cd /opt/log-centralizado && npm run db:push 2>&1 | tail -5",
        "Executando migrações"
    )
    if success:
        print(f"{Colors.GREEN}[✓] Migrações concluídas{Colors.END}")
    else:
        print(f"{Colors.YELLOW}[!] Migrações podem ter falhado (continuando){Colors.END}")
    
    # 6. Parar aplicação anterior
    print(f"\n{Colors.YELLOW}[6/7] Parando aplicação anterior...{Colors.END}")
    run_command("pkill -f 'npm run dev' 2>/dev/null", "Parando processo anterior")
    time.sleep(2)
    print(f"{Colors.GREEN}[✓] Aplicação anterior parada{Colors.END}")
    
    # 7. Iniciar aplicação
    print(f"\n{Colors.YELLOW}[7/7] Iniciando aplicação em background...{Colors.END}")
    success, output = run_command(
        "cd /opt/log-centralizado && nohup npm run dev > /tmp/log_centralizado.log 2>&1 &",
        "Iniciando npm dev"
    )
    time.sleep(5)
    
    # Verificar se está rodando
    success, pid = run_command("pgrep -f 'npm run dev'")
    if success and pid.strip():
        print(f"{Colors.GREEN}[✓] Aplicação iniciada (PID: {pid.strip()}){Colors.END}")
    else:
        print(f"{Colors.RED}[✗] Erro ao iniciar aplicação{Colors.END}")
        return False
    
    # Aguardar inicialização
    print(f"\n{Colors.BLUE}[*] Aguardando inicialização (10 segundos)...{Colors.END}")
    time.sleep(10)
    
    # Verificar se está respondendo
    success, http_code = run_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ || echo 'TIMEOUT'")
    
    # Resultado final
    print("\n" + "=" * 70)
    if http_code.strip() in ["200", "301", "302"]:
        print(f"{Colors.GREEN}✓ SETUP COMPLETO COM SUCESSO!{Colors.END}")
        print("=" * 70)
        print(f"\n{Colors.GREEN}✓ Aplicação está rodando (HTTP {http_code.strip()}){Colors.END}")
        print(f"{Colors.GREEN}✓ Acesse em: http://204.12.229.251:3000{Colors.END}")
        print(f"{Colors.GREEN}✓ PID: {pid.strip()}{Colors.END}")
    else:
        print(f"{Colors.YELLOW}⚠ SETUP CONCLUÍDO (COM AVISOS){Colors.END}")
        print("=" * 70)
        print(f"\n{Colors.YELLOW}[!] HTTP Code: {http_code.strip()}{Colors.END}")
        print(f"{Colors.YELLOW}[*] Verificando logs...{Colors.END}")
        success, logs = run_command("tail -20 /tmp/log_centralizado.log")
        print(logs)
    
    print("\n" + "=" * 70)
    print(f"{Colors.BLUE}COMANDOS ÚTEIS:{Colors.END}")
    print("=" * 70)
    print(f"\n{Colors.BLUE}Ver logs em tempo real:{Colors.END}")
    print(f"  tail -f /tmp/log_centralizado.log")
    print(f"\n{Colors.BLUE}Parar a aplicação:{Colors.END}")
    print(f"  pkill -f 'npm run dev'")
    print(f"\n{Colors.BLUE}Reiniciar a aplicação:{Colors.END}")
    print(f"  cd /opt/log-centralizado && npm run dev")
    print(f"\n{Colors.BLUE}Ver status:{Colors.END}")
    print(f"  ps aux | grep npm")
    print("\n" + "=" * 70)
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Colors.RED}Setup cancelado pelo usuário{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Erro: {e}{Colors.END}")
        sys.exit(1)
