import { useState } from 'react';
import { Box, Heading, HStack, Text } from '@chakra-ui/react';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';
import RelatorioAtivados from '../components/relatorios/RelatorioAtivação';
import RelatorioAtivacaoVIR from '../components/relatorios/RelatorioAtivaçãoVIR'; // Importação do novo componente
import EmpresaSwitcher from '../components/admin/EmpresaSwitcher';

export default function RelatorioAtivacaoPage() {
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
        pb={{ base: 32, md: 6 }}
        minH="100vh"
        overflowX="hidden"
        overflowY="auto"
      >
        <HStack justifyContent="space-between" alignItems="center" mb={4}>
          <Heading fontSize={{ base: 'xl', md: '2xl' }}>
            Relatório de Ativados
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

        {/* Renderização condicional com base na empresa selecionada */}
        {empresaSelecionada === '' ? (
          <Text fontSize="lg" color="gray.500">
            Por favor, selecione uma empresa para visualizar o relatório.
          </Text>
        ) : empresaSelecionada === 'Max Fibra' ? (
          <RelatorioAtivados empresaSelecionada={empresaSelecionada} />
        ) : empresaSelecionada === 'Vir Telecom' ? (
          <RelatorioAtivacaoVIR />
        ) : (
          <Text fontSize="lg" color="gray.500">
            Empresa não reconhecida. Por favor, selecione uma empresa válida.
          </Text>
        )}
      </Box>

      <BottomBar />
    </Box>
  );
}