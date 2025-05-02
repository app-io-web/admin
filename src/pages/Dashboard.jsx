import { Box, Heading } from '@chakra-ui/react';
import { useState } from 'react';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';
import { SimpleGrid, GridItem } from '@chakra-ui/react';

import EmpresaSwitcher from '../components/admin/EmpresaSwitcher';
import TarefasAtrasadasCard from '../components/tarefas/TarefasAtrasadasCard';
import TarefasNaoAtrasadasCard from '../components/tarefas/TarefasNaoAtrasadasCard';

// Gráficos padrão
import GraficoStatusClientes from '../components/charts/GraficoStatusClientes';
import GraficoClientesAtivadosComparativo from '../components/charts/GraficoClientesAtivadosComparativo';
import OrdensExecucaoCard from '../components/OrdensExecucaoCard';
import StatusOnusCard from '../components/StatusOnusCard';

// Gráficos novos da pasta chart
import GraficoClientesAtivadosMes from '../components/charts/chart/GraficoClientesAtivadosMes';
import GraficoClientesBloqueadosMes from '../components/charts/chart/GraficoClientesBloqueadosMes';
import GraficoClientesInstaladosMes from '../components/charts/chart/GraficoClientesInstaladosMes';
import GraficodeQuantidadeOrdensAgendadas from '../components/charts/chart/GraficodeQuantidadeOrdensAgendadas';

// VIR TELECOM
import ClientesBloqueadosVirAccordion from '../components/ClientesBloqueadosVirAccordion';
import GraficoComparativoClientesVir from '../components/charts/GraficoComparativoClientesVir';
import GraficoCanceladosVirTimeline from '../components/charts/GraficoCanceladosVirTimeline';

export default function Dashboard() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const [empresaSelecionada, setEmpresaSelecionada] = useState(() => {
    return localStorage.getItem('empresaSelecionada') || '';
  });

  const [temAtrasadas, setTemAtrasadas] = useState(false);
  const [temNaoAtrasadas, setTemNaoAtrasadas] = useState(false);

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />

      <Box
        position="fixed"
        top="20px"
        right="24px"
        zIndex={30}
        display={{ base: 'none', md: 'block' }}
      >
        <PerfilUsuarioDesktop usuario={usuario} />
      </Box>

      <Box
        flex="1"
        px={{ base: 4, md: 6 }}
        pt={{ base: 4, md: 6 }}
        pb={{ base: 24, md: 6 }}
        minH="100vh"
        overflowX="hidden"
        overflowY="auto"
      >
        <Heading fontSize={{ base: 'xl', md: '2xl' }}>Painel Admin</Heading>

        <Box mt={2} mb={6}>
          <EmpresaSwitcher
            empresas={usuario?.empresa || ''}
            onChange={(empresa) => setEmpresaSelecionada(empresa)}
          />
        </Box>

        {empresaSelecionada === 'Vir Telecom' ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 4, lg: 7 }} justifyItems="center">
            <GridItem w="full" maxW="400px">
              <GraficoComparativoClientesVir />
            </GridItem>
            <GridItem w="full" maxW="400px">
              <ClientesBloqueadosVirAccordion />
            </GridItem>
            <GridItem w="full" maxW="400px">
              <GraficoCanceladosVirTimeline />
            </GridItem>
          </SimpleGrid>
        ) : (
          <>
            {/* Linha 1 - Gráficos pequenos */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                <Box w="100%">
                  <GraficoClientesAtivadosMes />
                </Box>
                <Box w="100%">
                  <GraficoClientesBloqueadosMes />
                </Box>
                <Box w="100%">
                  <GraficoClientesInstaladosMes />
                </Box>
              </SimpleGrid>

              {/* Linha 2 - Gráficos grandes (2 por linha, se couber) */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
                  <Box w="100%">
                    <GraficodeQuantidadeOrdensAgendadas />
                  </Box>
                  <Box w="100%">
                    <GraficoClientesAtivadosComparativo />
                  </Box>
                </SimpleGrid>


              <Box>
                <StatusOnusCard />
                <TarefasAtrasadasCard setTemAtrasadas={setTemAtrasadas} />
                <TarefasNaoAtrasadasCard setTemNaoAtrasadas={setTemNaoAtrasadas} />
              </Box>

          </>
        )}
      </Box>

      <BottomBar />
    </Box>
  );
}
