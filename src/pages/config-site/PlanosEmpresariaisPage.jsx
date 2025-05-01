import { Box, Heading, Flex } from '@chakra-ui/react';
import AdminSidebarDesktop from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';
import ConfigPlanosEmpresariais from '../../components/configuracao_site/ConfigPlanosEmpresariais';

export default function PlanosEmpresariaisPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  return (
    <Flex minH="100vh" position="relative">
      <AdminSidebarDesktop />

      <Box flex="1" display="flex" flexDirection="column" overflowY="auto">
        <Box position="fixed" top="20px" right="24px" zIndex={30} display={{ base: 'none', md: 'block' }}>
          <PerfilUsuarioDesktop usuario={usuario} />
        </Box>

        <Box px={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }} pb={{ base: 24, md: 6 }} maxW="100%">
          <Heading mb={6}>Planos Empresariais</Heading>
          <ConfigPlanosEmpresariais />
        </Box>
      </Box>

      <BottomBar />
    </Flex>
  );
}
