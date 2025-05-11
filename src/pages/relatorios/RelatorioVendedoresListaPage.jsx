import { Box } from '@chakra-ui/react';
import RelatorioVendedoresLista from '../../components/relatorios/RelatorioVendedoresLista';
import AdminSidebarDesktop from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';

export default function RelatorioVendedoresListaPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  return (
    <Box display="flex" minH="100vh">
      <AdminSidebarDesktop />
      <Box flex="1" p={4}>
        <Box position="fixed" top="20px" right="24px" zIndex={30}>
          <PerfilUsuarioDesktop usuario={usuario} />
        </Box>
        <RelatorioVendedoresLista />
      </Box>
      <BottomBar />
    </Box>
  );
}
