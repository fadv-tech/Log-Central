import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Server, FileText, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const serversQuery = trpc.servers.list.useQuery();
  
  const totalServers = serversQuery.data?.length || 0;
  let totalLogs = 0;
  let totalErrors = 0;

  // Calculate stats from servers data
  if (serversQuery.data) {
    serversQuery.data.forEach(server => {
      // Note: In a real app, you'd fetch stats for each server
      // For now, we'll just display the server count
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Visão geral do seu sistema de logs centralizado</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Server className="w-4 h-4" />
              Servidores Conectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalServers}</div>
            <p className="text-xs text-gray-500 mt-1">Servidores ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Logs Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLogs.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Logs registrados nas últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Erros e Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{totalErrors}</div>
            <p className="text-xs text-gray-500 mt-1">Nas últimas 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Servidores */}
      <Card>
        <CardHeader>
          <CardTitle>Servidores Conectados</CardTitle>
        </CardHeader>
        <CardContent>
          {serversQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : serversQuery.data && serversQuery.data.length > 0 ? (
            <div className="space-y-3">
              {serversQuery.data.map((server) => (
                <div key={server.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-1">
                    <h3 className="font-medium">{server.name}</h3>
                    <p className="text-sm text-gray-600">{server.ipAddress} • {server.serverType}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold">0</div>
                      <p className="text-xs text-gray-500">logs hoje</p>
                    </div>
                    <Badge variant={server.isActive ? "default" : "secondary"}>
                      {server.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum servidor conectado ainda.</p>
              <p className="text-sm mt-2">Vá para Configurações para adicionar servidores.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
