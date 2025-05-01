import { Box, Heading, Flex } from '@chakra-ui/react';
import SideBar from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';
import ConfigServicoAdicional from '../../components/configuracao_site/ConfigServicoAdicional';

export default function PlanosServicoAdicionalPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  return (
    <Flex minH="100vh" position="relative">
      <SideBar />
      <Box flex="1" display="flex" flexDirection="column" overflowY="auto">
        <Box flex="1" px={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }} pb={{ base: 24, md: 6 }} maxW="100%">
          <Box position="fixed" top="20px" right="24px" zIndex={30} display={{ base: 'none', md: 'block' }}>
            <PerfilUsuarioDesktop usuario={usuario} />
          </Box>
          <Heading mb={6}>Serviços Adicionais dos Planos</Heading>
          <ConfigServicoAdicional />
        </Box>
        <BottomBar />
      </Box>
    </Flex>
  );
}
