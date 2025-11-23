import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";

/**
 * Página inicial do Log Centralizado
 */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <div className="mb-8">
            <img src={APP_LOGO} alt={APP_TITLE} className="w-20 h-20 mx-auto rounded-lg shadow-lg" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{APP_TITLE}</h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Sistema centralizado para coleta, armazenamento e análise de logs de múltiplos servidores
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-gray-600 text-sm">Visualize estatísticas e métricas em tempo real</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-semibold text-gray-900 mb-2">Busca Avançada</h3>
              <p className="text-gray-600 text-sm">Encontre logs com filtros por data, nível e servidor</p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Configurações</h3>
              <p className="text-gray-600 text-sm">Gerencie servidores e API Keys</p>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Ir para Dashboard
            </Button>
            <Button size="lg" variant="outline">
              Documentação
            </Button>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-gray-600">
        <p>&copy; 2024 {APP_TITLE}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
