import { Box } from '@chakra-ui/react';
import RelatorioVendasGeral from '../../components/relatorios/RelatorioVendasGeral';
import AdminSidebarDesktop from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';

export default function RelatorioVendasGeralPage() {

    const usuario = JSON.parse(localStorage.getItem('usuario')) || {};


  return (
    <Box display="flex" minH="100vh">
      <AdminSidebarDesktop />
      <Box flex="1" p={4} pb={{ base: 24, md: 4 }}>
        <PerfilUsuarioDesktop usuario={usuario} />
        <RelatorioVendasGeral />
      </Box>
      <BottomBar />
    </Box>
  );
}
