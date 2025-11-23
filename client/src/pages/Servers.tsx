import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function Servers() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    hostname: "",
    ipAddress: "",
    serverType: "linux" as const,
    description: "",
  });
  const [copiedKey, setCopiedKey] = useState<number | null>(null);

  const serversQuery = trpc.servers.list.useQuery();
  const createServerMutation = trpc.servers.create.useMutation({
    onSuccess: () => {
      serversQuery.refetch();
      setFormData({ name: "", hostname: "", ipAddress: "", serverType: "linux", description: "" });
      setShowCreateDialog(false);
      toast.success("Servidor criado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao criar servidor: ${error.message}`);
    },
  });

  const handleCreateServer = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    createServerMutation.mutate(formData);
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Servidores</h1>
          <p className="text-gray-600 mt-2">Gerencie os servidores que enviam logs</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex gap-2">
              <Plus className="w-4 h-4" />
              Novo Servidor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Servidor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Servidor Web 01"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hostname</label>
                <Input
                  value={formData.hostname}
                  onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                  placeholder="Ex: web01.example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Endereço IP <span className="text-gray-500 text-xs">(opcional)</span></label>
                <Input
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  placeholder="Ex: 192.168.1.100 (deixe em branco para aceitar qualquer IP)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Servidor</label>
                <Select value={formData.serverType} onValueChange={(value: any) => setFormData({ ...formData, serverType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linux">Linux</SelectItem>
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="mikrotik">Mikrotik</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Descrição (opcional)</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Servidor de produção"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateServer}
                  disabled={createServerMutation.isPending}
                  className="flex-1"
                >
                  {createServerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Criar
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Servidores */}
      <Card>
        <CardHeader>
          <CardTitle>Servidores Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {serversQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : serversQuery.data && serversQuery.data.length > 0 ? (
            <div className="space-y-3">
              {serversQuery.data.map((server) => (
                <div key={server.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{server.name}</h3>
                        <Badge variant={server.isActive ? "default" : "secondary"}>
                          {server.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">{server.serverType}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {server.hostname && `${server.hostname} • `}
                        {server.ipAddress}
                      </p>
                      {server.description && <p className="text-sm text-gray-500 mt-1">{server.description}</p>}
                      <p className="text-xs text-gray-400 mt-2">
                        Criado em {new Date(server.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum servidor registrado ainda.</p>
              <p className="text-sm mt-2">Clique em "Novo Servidor" para adicionar um.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
