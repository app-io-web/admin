import { useDisclosure, Button, Box, Heading, Flex } from '@chakra-ui/react';
import AdminSidebarDesktop from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';
import ConfigBannerEmpresarial from '../../components/configuracao_site/ConfigBannerEmpresarial';
import PreviewSite from '../../components/configuracao_site/PreviewSite';

export default function BannerEmpresarialPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Flex minH="100vh" position="relative">
      <AdminSidebarDesktop />

      
      <Box flex="1" display="flex" flexDirection="column" overflowY="auto">
        <Box position="fixed" top="20px" right="24px" zIndex={30} display={{ base: 'none', md: 'block' }}>
          <PerfilUsuarioDesktop usuario={usuario} />
        </Box>

        <Box px={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }} pb={{ base: 24, md: 6 }} maxW="100%">
          <Heading mb={6}>Banner Empresarial</Heading>
          <ConfigBannerEmpresarial />
        </Box>

        {/* Botão Preview Site fixo no canto inferior direito */}
        <Box position="fixed" bottom="24px" right="24px" zIndex={20}>
          <Button colorScheme="teal" onClick={onOpen}>Preview Site</Button>
        </Box>
      </Box>

      <BottomBar />
      <PreviewSite isOpen={isOpen} onClose={onClose} empresaMode={true} />
      </Flex>
  );
}
