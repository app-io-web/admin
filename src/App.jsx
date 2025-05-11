import { Box } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';


import { useEffect } from 'react';
import { registrarNotificacaoPush } from './utils/pushNotifications';


// Páginas do painel
import Dashboard from './pages/Dashboard';
import AtalhosAdmin from './components/admin/AtalhosAdmin';
import DashboardCobranca from './pages/DashboardCobranca'
import ConfiguracaoCobranca from './pages/cobranca/ConfiguracaoCobranca';
import CreateUserPage from './pages/CreateUserPage';
import PermissionsPage from './pages/PermissionsPage/PermissionsPage';

import ToDoPage from './pages/ToDoPage';
import KanbanPage from './pages/KanbanPage';

import KanbanBoard from './components/kanban/KanbanBoard';

import GoogleCalendarPage from './pages/GoogleCalendarPage';
import TasksAndKanbanPage from './pages/TasksAndKanbanPage';
import GoogleCalendarIntegration from './components/google_integracao/GoogleCalendarIntegration';


import NotasPessoaisPage from './pages/NotasPessoaisPage';
import AtalhosPessoaisPage from './pages/AtalhosPessoaisPage';

import RelatorioBloqueadosPage from './pages/RelatorioBloqueadosPage';
import RelatorioAtivacaoPage from './pages/RelatorioAtivosPage';

import ConsultaClientePage from './pages/ConsultaClientePage';
import FechamentoDiarioPage from './pages/FechamentoDiarioPage';
import HistoricoFechamentosPage from './pages/HistoricoFechamentosPage';



import BannerEmpresarialPage from './pages/config-site/BannerEmpresarialPage';
import BannerPrincipalPage from './pages/config-site/BannerPrincipalPage';
import FraseDinamicaPage from './pages/config-site/FraseDinamicaPage';
import PlanosEmpresariaisPage from './pages/config-site/PlanosEmpresariaisPage';
import PlanosServicoAdicionalPage from './pages/config-site/PlanosServicosAdicionaisPage';
import ConfigDuvidasFrequentesPage from './pages/config-site/DuvidasFrequentesPage';
import CamposGeraisPage from './pages/config-site/CamposGeraisPage';
import ServicosPlanosPage from './pages/config-site/ServicosPlanosPage';
import VendedoresPage from './pages/config-site/VendedoresPage';
import CupomDescontoPage from './pages/config-site/CupomDescontoPage';

import RelatorioOnus from './pages/monitoramento/RelatorioOnus';


import ChatPage from './pages/chat/ChatPage';
import UsuariosCadastradosPage from './pages/UsuariosCadastradosPage';
import EditarUsuarioPage from './pages/EditarUsuarioPage';

import RelatorioVendedoresLista from './pages/relatorios/RelatorioVendedoresListaPage';
import RelatorioVendasMesPage from './pages/relatorios/VendasMesPage';
import RelatorioVendasGeralPage from './pages/relatorios/RelatorioVendasGeralPage_TEMP';


function App() {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'ABRIR_CHAT') {
          console.log('🔔 Notificação clicada: abrir chat');
          // lógica para abrir chat
        }
      });
  
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      if (usuario?.UnicID_User) {
        registrarNotificacaoPush(usuario.UnicID_User); // ✅ função correta
      }
    }
  }, []);
  
  
  


  return (
    <Box p={0}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/atalhos" element={<AtalhosAdmin />} />
        <Route path="/cobranca" element={<DashboardCobranca />} />
        <Route path="/cobranca/config" element={<ConfiguracaoCobranca />} />
        <Route path="/cadastros/createuser" element={<CreateUserPage />} />
        <Route path="/permissions/:userId" element={<PermissionsPage />} />
        <Route path="/editar-usuario/:id" element={<EditarUsuarioPage />} />

        <Route path="/cadastros/usuarios-cadastrados" element={<UsuariosCadastradosPage />} />
        <Route path="/tarefas" element={<ToDoPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
        <Route path="/kanban/:boardId" element={<KanbanBoard />} />

        <Route path="/calendar" element={<GoogleCalendarPage />} />
        <Route path="/tasks-and-kanban" element={<TasksAndKanbanPage />} />
        <Route path="/avancado/google-integration" element={<GoogleCalendarIntegration />} />



        <Route path="/notas" element={<NotasPessoaisPage />} />
        <Route path="/atalhos/pessoais" element={<AtalhosPessoaisPage />} />

        <Route path="/relatorios/bloqueados" element={<RelatorioBloqueadosPage />} />
        <Route path="/relatorios/Ativados" element={<RelatorioAtivacaoPage />} />
        <Route path="/relatorios/reis/historico-fechamento" element={<HistoricoFechamentosPage />} />


        <Route path="/avancado/consultavir" element={<ConsultaClientePage />} />


        <Route path="/reis/fechamento" element={<FechamentoDiarioPage />} />


        <Route path="/admin/avancado/config-site/empresarialbanners" element={<BannerEmpresarialPage />} />
        <Route path="/admin/avancado/config-site/principalbanners" element={<BannerPrincipalPage />} />
        <Route path="/admin/avancado/config-site/dinamicsfrase" element={<FraseDinamicaPage />} />
        <Route path="/admin/avancado/config-site/planosempresariais" element={<PlanosEmpresariaisPage />} />
        <Route path="/admin/avancado/config-site/planos-servico-adicional-page" element={<PlanosServicoAdicionalPage />} />
        <Route path="/admin/avancado/config-site/duvidasfrequente" element={<ConfigDuvidasFrequentesPage />} />
        <Route path="/admin/avancado/config-site/configuracoes-gerais" element={<CamposGeraisPage />} />
        <Route path="/admin/avancado/config-site/configuracoes-servicos" element={<ServicosPlanosPage />} />
        <Route path="/admin/avancado/config-site/vendedores" element={<VendedoresPage />} />
        <Route path="/admin/avancado/config-site/cupom-desconto" element={<CupomDescontoPage />} />

        <Route path="/admin/chat" element={<ChatPage />} />

        <Route path="relatorios/monitoramento/onus" element={<RelatorioOnus />} />
        <Route path="/relatorios/vendas" element={<RelatorioVendedoresLista />} />
        <Route path="/relatorios/vendas/:vendedorId" element={<RelatorioVendasMesPage />} />
        <Route path="/relatorios/vendas/geral" element={<RelatorioVendasGeralPage />} />






      </Routes>
    </Box>
  );
}

export default App;
