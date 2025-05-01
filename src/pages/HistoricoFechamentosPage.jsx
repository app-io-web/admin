import { Box, Heading, Flex } from '@chakra-ui/react';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';
import HistoricoFechamentos from '../components/fechamento_diario/HistoricoFechamentos';

export default function HistoricoFechamentosPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  return (
    <Flex minH="100vh" position="relative">
      <SideBar />
      <Box flex="1" display="flex" flexDirection="column" overflowY="auto">
        <Box
          flex="1"
          pt={{ base: 4, md: 6 }}
          pb={{ base: 24, md: 6 }}
          w="100%"
          maxW="100%"
        >
          <Box position="fixed" top="20px" right="24px" zIndex={30} display={{ base: 'none', md: 'block' }}>
            <PerfilUsuarioDesktop usuario={usuario} />
          </Box>
          <Heading fontSize={{ base: 'xl', md: '2xl' }} mb={6} px={{ base: 4, md: 6 }}>
            Histórico de Fechamentos
          </Heading>
          <HistoricoFechamentos />
        </Box>
        <BottomBar />
      </Box>
    </Flex>
  );
}