import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Search, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LOG_LEVELS = ["debug", "info", "warning", "error", "critical"];
const LOG_SOURCES = ["syslog", "eventlog", "api", "custom"];

export default function LogsSearch() {
  const [serverId, setServerId] = useState<number | undefined>();
  const [level, setLevel] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(50);

  const serversQuery = trpc.servers.list.useQuery();
  
  const startTime = useMemo(() => {
    if (!startDate) return undefined;
    return new Date(startDate).getTime();
  }, [startDate]);

  const endTime = useMemo(() => {
    if (!endDate) return undefined;
    const date = new Date(endDate);
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  }, [endDate]);

  const logsQuery = trpc.logs.search.useQuery(
    {
      serverId,
      level: level || undefined,
      source: source || undefined,
      startTime,
      endTime,
      searchText: searchText || undefined,
      limit,
      offset,
    },
    { enabled: !!serverId }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Buscar Logs</h1>
        <p className="text-gray-600 mt-2">Pesquise e filtre logs de todos os seus servidores</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Servidor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Servidor</label>
              <Select value={serverId?.toString() || ""} onValueChange={(val) => setServerId(val ? parseInt(val) : undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um servidor" />
                </SelectTrigger>
                <SelectContent>
                  {serversQuery.data?.map((server) => (
                    <SelectItem key={server.id} value={server.id.toString()}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nível */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nível</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os níveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {LOG_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fonte */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fonte</label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as fontes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {LOG_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Inicial */}
            <div className="space-y-2">
              <label className="text-sm font-medium">De</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            {/* Data Final */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Até</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            {/* Busca por Texto */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Buscar por Texto</label>
              <Input
                placeholder="Digite uma palavra-chave..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={() => setOffset(0)} className="w-full">
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {!serverId ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Selecione um servidor para começar a buscar logs</AlertDescription>
        </Alert>
      ) : logsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : logsQuery.data && logsQuery.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Resultados ({logsQuery.data.length} logs)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logsQuery.data.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.level === "error" ? "destructive" : "secondary"}>
                        {log.level}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{log.message}</p>
                    {log.metadata && (
                      <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Paginação */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {Math.floor(offset / limit) + 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setOffset(offset + limit)}
                disabled={logsQuery.data.length < limit}
              >
                Próxima
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Nenhum log encontrado com os filtros selecionados</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
