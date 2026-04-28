import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"; // Importar useQuery
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { HubLayout } from "./components/HubLayout";
import { SessionContextProvider } from "./components/SessionContextProvider";
import { supabase } from '@/integrations/supabase/client'; // Importar supabase
import BirthdaysPage from "./pages/BirthdaysPage";
import WhatsAppPage from "./pages/WhatsAppPage"; // Importar WhatsAppPage
import AutomacoesPage from "./pages/AutomacoesPage"; // Importar AutomacoesPage

const queryClient = new QueryClient();

console.log("VITE_TASK_WEBHOOK_URL from App.tsx:", import.meta.env.VITE_TASK_WEBHOOK_URL);

const AppContent = () => {
  // Centralizar a busca de dados dos membros aqui
  const { data: members, isLoading: isLoadingMembers, isError: isErrorMembers, error: errorMembers, refetch: refetchMembers } = useQuery<any[], Error>({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('evo-proxy');
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.details || data.error);
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  return (
    <BrowserRouter>
      <SessionContextProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <HubLayout 
                members={members || []} 
                isLoadingMembers={isLoadingMembers} 
                errorMembers={isErrorMembers ? errorMembers.message : null}
                refetchMembers={refetchMembers}
              />
            }
          >
            <Route 
              index 
              element={
                <DashboardPage 
                  members={members || []} 
                  isLoadingMembers={isLoadingMembers} 
                  errorMembers={isErrorMembers ? errorMembers.message : null}
                  refetchMembers={refetchMembers}
                />
              } 
            />
            <Route path="birthdays" element={<BirthdaysPage />} />
            <Route path="whatsapp" element={<WhatsAppPage />} /> {/* Adicionando rota do WhatsApp */}
            <Route path="automacoes" element={<AutomacoesPage />} /> {/* Rota de Automações */}
            <Route path="profile" element={<UserProfile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </SessionContextProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;