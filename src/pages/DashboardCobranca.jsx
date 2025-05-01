import { useEffect, useState } from 'react';
import { Box, Heading } from '@chakra-ui/react';
import AdminSidebarDesktop from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';
import EmpresaSwitcher from '../components/admin/EmpresaSwitcher';
import ListaClientesBloqueados from '../components/cobranca/ListaClientesBloqueados';
import ListaClientesBloqueadosVir from '../components/cobranca/ListaClientesBloqueadosVir';

export default function DashboardCobranca() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  const [empresaSelecionada, setEmpresaSelecionada] = useState(() => {
    return localStorage.getItem('empresaSelecionada') || 'Max Fibra';
  });

  useEffect(() => {
    localStorage.setItem('empresaSelecionada', empresaSelecionada);
  }, [empresaSelecionada]);

  return (
    <Box display="flex">
      <AdminSidebarDesktop />

      <Box
        position="fixed"
        top="20px"
        right="24px"
        zIndex={30}
        display={{ base: 'none', md: 'block' }}
      >
        <PerfilUsuarioDesktop usuario={usuario} />
      </Box>

      <Box flex="1" p={4} minH="100vh" overflow="auto" pb="100px">
        <Heading mb={4}>📊 Dashboard de Cobrança</Heading>

        <EmpresaSwitcher
          empresas="Max Fibra, Vir Telecom"
          onChange={setEmpresaSelecionada}
        />

          <Box mt={6}>
            {empresaSelecionada === 'Max Fibra' && <ListaClientesBloqueados />}
            {empresaSelecionada === 'Vir Telecom' && <ListaClientesBloqueadosVir empresaSelecionada={empresaSelecionada} />}
          </Box>
      </Box>

      <BottomBar />
    </Box>
  );
}
