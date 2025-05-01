import { Box, Heading, Flex } from '@chakra-ui/react';
import SideBar from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';

import ConfigLinksDownload from '../../components/configuracao_site/ConfigLinksDownload';
import ConfigNumeroTelefone from '../../components/configuracao_site/ConfigNumeroTelefone';
import ConfigRedesSociais from '../../components/configuracao_site/ConfigRedesSociais';

export default function CamposGeraisPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  return (
    <Flex minH="100vh" position="relative">
      <SideBar />
      <Box flex="1" display="flex" flexDirection="column" overflowY="auto">
        <Box position="fixed" top="20px" right="24px" zIndex={30} display={{ base: 'none', md: 'block' }}>
          <PerfilUsuarioDesktop usuario={usuario} />
        </Box>

        <Box px={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }} pb={{ base: 24, md: 6 }}>
          <Heading mb={6}>Configuração de Campos Gerais</Heading>

          <ConfigLinksDownload />
          <ConfigNumeroTelefone />
          <ConfigRedesSociais />
        </Box>
      </Box>
      <BottomBar />
    </Flex>
  );
}
