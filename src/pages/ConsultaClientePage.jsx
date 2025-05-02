import { useState } from 'react';
import { Box, Heading, HStack } from '@chakra-ui/react';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';
import ConsultaCliente from '../components/consulta/ConsultaCliente';

export default function ConsultaClientePage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />

      <Box
        flex="1"
        px={{ base: 2, md: 6 }} // Reduzindo o padding lateral em mobile
        pt={{ base: 4, md: 6 }}
        pb={{ base: 20, md: 6 }} // Ajustando o padding bottom para o BottomBar
        minH="100vh"
        overflowX="hidden"
        overflowY="auto"
      >
        <HStack 
          justifyContent={{ base: 'center', md: 'space-between' }} // Centralizando em mobile
          alignItems="center" 
          mb={{ base: 4, md: 6 }}
        >
          <Heading 
            fontSize={{ base: 'xl', md: '2xl' }} 
            textAlign={{ base: 'center', md: 'left' }} // Centralizando o título em mobile
          >
            Consulta de Cliente Vir Telecom
          </Heading>
            <Box
              position="fixed"
              top="20px"
              right="24px"
              zIndex={30}
              display={{ base: 'none', md: 'block' }}
            >
              <PerfilUsuarioDesktop usuario={usuario} />
            </Box>
        </HStack>

        <ConsultaCliente />
      </Box>

      <BottomBar />
    </Box>
  );
}