import { Box, Heading } from '@chakra-ui/react';
import SideBar from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';
import GraficoDashboardVendas from '../../components/charts/GraficoVendasMensais';

export default function ChartVendasPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />

        <Box
          flex="1"
          px={{ base: 4, md: 6 }}
          pt={{ base: 4, md: 6 }}
          pb={{ base: 24, md: 6 }}
          minH="100vh"
          overflowX="hidden"
          overflowY="auto"
          width="100%"
          maxWidth="none" // Remova ou ajuste o limite de largura
        >
        <Box
          position="fixed"
          top="20px"
          right="24px"
          zIndex={30}
          display={{ base: 'none', md: 'block' }}
        >
          <PerfilUsuarioDesktop usuario={usuario} />
        </Box>

        <Heading fontSize={{ base: 'xl', md: '2xl' }} mb={6}>
          Gráfico de Vendas por Mês
        </Heading>

        <Box w="100%" maxW="100%">
          <GraficoDashboardVendas />
        </Box>
      </Box>

      <BottomBar />
    </Box>
  );
}