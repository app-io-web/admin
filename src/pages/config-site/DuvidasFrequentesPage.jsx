import { Box, Flex } from '@chakra-ui/react';
import AdminSidebarDesktop from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';
import ConfigDuvidasFrequentes from '../../components/configuracao_site/ConfigDuvidasFrequentes';

export default function ConfigDuvidasFrequentesPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  return (
    <Flex minH="100vh" position="relative">
      <AdminSidebarDesktop />
      <Box flex="1" display="flex" flexDirection="column" overflowY="auto">
        <Box
          flex="1"
          px={{ base: 4, md: 6 }}
          pt={{ base: 4, md: 6 }}
          pb={{ base: 24, md: 6 }}
          maxW="100%"
          w="100%" // Adicione w="100%" aqui para garantir que o contêiner ocupe toda a largura
        >
          <Box position="fixed" top="20px" right="24px" zIndex={30} display={{ base: 'none', md: 'block' }}>
            <PerfilUsuarioDesktop usuario={usuario} />
          </Box>
          <ConfigDuvidasFrequentes />
        </Box>
        <BottomBar />
      </Box>
    </Flex>
  );
}