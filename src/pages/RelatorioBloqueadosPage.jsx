import { useState } from 'react';
import { Box, Heading, HStack } from '@chakra-ui/react';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';
import RelatorioBloqueados from '../components/relatorios/RelatorioBloqueados';
import EmpresaSwitcher from '../components/admin/EmpresaSwitcher';

export default function RelatorioBloqueadosPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const [empresaSelecionada, setEmpresaSelecionada] = useState(() => {
    return localStorage.getItem('empresaSelecionada') || '';
  });

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />

      <Box
        flex="1"
        px={{ base: 4, md: 6 }}
        pt={{ base: 4, md: 6 }}
        pb={{ base: 32, md: 6 }} // Aumentado no mobile para garantir espaço para a BottomBar
        minH="100vh"
        overflowX="hidden"
        overflowY="auto"
      >
        <HStack justifyContent="space-between" alignItems="center" mb={4}>
          <Heading fontSize={{ base: 'xl', md: '2xl' }}>
            Relatório de Bloqueados
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

        <Box mb={6}>
          <EmpresaSwitcher
            empresas={usuario?.empresa || ''}
            onChange={(empresa) => setEmpresaSelecionada(empresa)}
          />
        </Box>

        <RelatorioBloqueados empresaSelecionada={empresaSelecionada} />
      </Box>

      <BottomBar />
    </Box>
  );
}