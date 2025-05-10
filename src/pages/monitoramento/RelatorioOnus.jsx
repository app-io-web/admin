import { Box, Heading } from '@chakra-ui/react';
import RelatorioOnusOffline from '../../components/monitoramento/RelatorioOnusOffline';
import SideBar from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';

export default function RelatorioOnus() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />

      <Box
        flex="1"
        px={{ base: 4, md: 6 }}
        pt={{ base: 4, md: 6 }}
        pb={{ base: 24, md: 6 }}
        overflowY="auto"
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
          Monitoramento de ONUs Offline
        </Heading>

        <RelatorioOnusOffline />
      </Box>

      <BottomBar />
    </Box>
  );
}
