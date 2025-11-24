# Log Centralizado - TODO

## Fase 1: Análise e Definição da Arquitetura
- [x] Definir stack tecnológico (Express.js + React + MySQL)
- [x] Projetar schema de banco de dados
- [x] Planejar arquitetura de ingestão de logs

## Fase 2: Configuração do Ambiente
- [x] Criar schema de banco de dados para armazenar logs e metadados
- [x] Configurar tRPC para comunicação frontend-backend
- [x] Implementar autenticação local

## Fase 3: Backend - API de Ingestão e Consulta
- [x] Criar endpoint de ingestão de logs (POST /api/logs/ingest)
- [x] Implementar parser de logs com suporte a metadados
- [x] Criar endpoint de busca de logs (GET /api/logs/search)
- [x] Implementar filtros por timestamp, servidor, tipo de log, etc.
- [x] Adicionar autenticação para endpoints de ingestão
- [x] Criar testes unitários para API de ingestão
- [x] Implementar gerenciamento de API Keys
- [x] Adicionar estatísticas e métricas de logs
- [x] Implementar Log Sources (configurações de fontes de logs)

## Fase 4: Frontend - Interface de Visualização e Busca
- [x] Criar layout dashboard com sidebar navigation
- [x] Implementar página de busca de logs com filtros avançados
- [x] Implementar paginação e sorting de resultados
- [x] Criar página de gerenciamento de servidores
- [x] Criar página de configurações (API Keys, instruções)
- [x] Adicionar visualização de metadados e tags

## Fase 5: Scripts de Coleta de Logs
- [x] Criar script de coleta para Linux (syslog)
- [x] Criar script de coleta para Windows (Event Viewer)
- [x] Criar script de coleta para Mikrotik
- [x] Documentar agendamento de coleta (cron/Task Scheduler)

## Fase 6: Documentação e Entrega
- [x] Criar SETUP.md com instruções de uso
- [x] Documentar API de ingestão
- [x] Criar guia de configuração para cada tipo de servidor
- [x] Preparar scripts de coleta prontos para uso

## ✅ Projeto Completo

### Backend
- ✅ API de ingestão de logs com validação
- ✅ Busca avançada com filtros
- ✅ Gerenciamento de API Keys
- ✅ Estatísticas de logs
- ✅ 21 testes unitários passando

### Frontend
- ✅ Dashboard com estatísticas
- ✅ Página de busca de logs com filtros completos
- ✅ Gerenciamento de servidores
- ✅ Página de configurações com instruções
- ✅ Sidebar navigation responsivo

### Scripts de Coleta
- ✅ linux-log-collector.sh (syslog)
- ✅ windows-log-collector.ps1 (Event Viewer)
- ✅ mikrotik-log-collector.rsc (Mikrotik)

### Documentação
- ✅ SETUP.md com guia completo
- ✅ Instruções de instalação
- ✅ Guia de uso da aplicação
- ✅ Documentação da API
- ✅ Guias de configuração por plataforma


## Testes Manuais Completos

### Dashboard
- [ ] Verificar se os 34 servidores aparecem corretamente
- [ ] Verificar se as estatísticas (Servidores Conectados, Logs Hoje, Erros) aparecem
- [ ] Clicar em cada servidor e verificar se carrega sem erros

### Buscar Logs
- [ ] Acessar página "Buscar Logs"
- [ ] Testar filtro por servidor
- [ ] Testar filtro por nível (info, warning, error)
- [ ] Testar filtro por data/hora
- [ ] Testar busca por texto
- [ ] Testar paginação

### Servidores
- [ ] Listar todos os servidores
- [ ] Criar novo servidor (com e sem IP)
- [ ] Editar servidor existente
- [ ] Deletar servidor

### Configurações
- [x] Selecionar um servidor
- [x] Criar nova API Key
- [x] Copiar API Key
- [x] Mostrar/ocultar API Key
- [x] Listar API Keys do servidor
- [ ] Criar Log Source
- [ ] Listar Log Sources

## 🔴 BUG CORRIGIDO: API Keys
- [x] Problema: Frontend mostrava "undefined" ao copiar chave
- [x] Causa: createApiKey retornava apenas resultado do insert, não o objeto completo
- [x] Solução: Modificar createApiKey para retornar o objeto da chave criada
- [x] Teste: Criar nova chave "Nova Chave Teste" e confirmar que aparece na lista
- [x] Commit: 905bca1 - "Corrigir bug de API Keys: retornar chave completa ao frontend"

### Geral
- [x] Verificar se não há erros no console
- [x] Verificar se todos os dados persistem no banco
- [ ] Testar responsividade em mobile
- [ ] Testar navegação entre páginas
