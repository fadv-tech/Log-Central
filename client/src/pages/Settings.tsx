import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Copy, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [keyName, setKeyName] = useState("");
  const [showKeys, setShowKeys] = useState<Record<number, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const serversQuery = trpc.servers.list.useQuery();
  
  // Estabilizar input para evitar re-renders infinitos
  const apiKeysInput = useMemo(() => 
    selectedServerId ? { serverId: parseInt(selectedServerId) } : null,
    [selectedServerId]
  );
  
  // Usar a query apenas quando há input válido
  const apiKeysQuery = trpc.apiKeys.listByServer.useQuery(
    apiKeysInput || { serverId: 0 },
    { enabled: !!apiKeysInput }
  );

  const createKeyMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      apiKeysQuery.refetch();
      setKeyName("");
      setShowCreateKeyDialog(false);
      toast.success("API Key criada com sucesso!");
      toast.info(`Copie a chave: ${data.key}`, { duration: 10000 });
    },
    onError: (error) => {
      toast.error(`Erro ao criar API Key: ${error.message}`);
    },
  });

  const handleCreateKey = useCallback(async () => {
    if (!selectedServerId || !keyName) {
      toast.error("Selecione um servidor e defina um nome");
      return;
    }

    createKeyMutation.mutate({
      serverId: parseInt(selectedServerId),
      name: keyName,
    });
  }, [selectedServerId, keyName, createKeyMutation]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const displayedKeys = apiKeysInput ? (apiKeysQuery.data || []) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-600 mt-2">Gerencie API Keys e configurações de ingestão</p>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione um Servidor</label>
            <Select value={selectedServerId} onValueChange={setSelectedServerId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um servidor" />
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

          {selectedServerId && (
            <>
              <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Nova API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova API Key</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome da Chave</label>
                      <Input
                        placeholder="Ex: Coleta Linux"
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleCreateKey}
                      disabled={createKeyMutation.isPending}
                      className="w-full"
                    >
                      {createKeyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Criar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Lista de API Keys */}
              <div className="space-y-3">
                <h3 className="font-semibold">API Keys do Servidor</h3>
                {apiKeysQuery.isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : displayedKeys.length > 0 ? (
                  displayedKeys.map((key) => (
                    <div key={key.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{key.name}</span>
                        <Badge variant="outline">
                          {new Date(key.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type={showKeys[key.id] ? "text" : "password"}
                          value={key.key}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowKeys({ ...showKeys, [key.id]: !showKeys[key.id] })}
                        >
                          {showKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(key.key)}
                        >
                          {copiedKey === key.key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma API Key criada ainda</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Instruções de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">1. Criar uma API Key</h4>
            <p className="text-gray-600">Selecione um servidor e clique em "Criar Nova API Key" para gerar uma chave de autenticação.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Usar em Scripts</h4>
            <p className="text-gray-600">Copie a chave e use em seus scripts de coleta de logs:</p>
            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto text-xs">
{`curl -X POST http://seu-servidor:3000/api/trpc/logs.ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "serverId": 1,
    "level": "info",
    "message": "Log de teste",
    "source": "syslog"
  }'`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
