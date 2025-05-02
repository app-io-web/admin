// src/pages/chat/ChatPage.jsx
import { Box, Heading, Flex } from '@chakra-ui/react';
import SideBar from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';
import ChatComponent from '../../components/chat/ChatComponent'; // Importa o componente do chat

export default function ChatPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  return (
    <Flex minH="100vh" position="relative">
      <SideBar />

      <Box flex="1" display="flex" flexDirection="column" overflowY="auto">
        {/* Perfil no Desktop */}
      <Box
        position="fixed"
        top="20px"
        right="24px"
        zIndex={30}
        display={{ base: 'none', md: 'block' }}
      >
        <PerfilUsuarioDesktop usuario={usuario} />
      </Box>

        {/* Área principal */}
        <Box
          flex="1"
          px={{ base: 4, md: 6 }}
          pt={{ base: 4, md: 6 }}
          pb={{ base: 24, md: 6 }}
          display="flex"
          flexDirection="column"
          maxW="100%"
        >
          <Heading fontSize={{ base: 'xl', md: '2xl' }} mb={10}>
            Chat em Tempo Real
          </Heading>

          {/* Aqui fica o Chat */}
          <Box flex="1" minH="500px">
            <ChatComponent />
          </Box>
        </Box>

        <BottomBar />
      </Box>
    </Flex>
  );
}
