import { Box, Heading } from '@chakra-ui/react';
import { useState } from 'react';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';
import { SimpleGrid, GridItem } from '@chakra-ui/react';

import GraficoStatusClientes from '../components/charts/GraficoStatusClientes';
import GraficoClientesAtivadosComparativo from '../components/charts/GraficoClientesAtivadosComparativo';
import OrdensExecucaoCard from '../components/OrdensExecucaoCard';
import StatusOnusCard from '../components/StatusOnusCard';
import EmpresaSwitcher from '../components/admin/EmpresaSwitcher';
import TarefasAtrasadasCard from '../components/tarefas/TarefasAtrasadasCard';
import TarefasNaoAtrasadasCard from '../components/tarefas/TarefasNaoAtrasadasCard';



import ClientesBloqueadosVirAccordion from '../components/ClientesBloqueadosVirAccordion';
import GraficoComparativoClientesVir from '../components/charts/GraficoComparativoClientesVir';
import GraficoCanceladosVirTimeline from '../components/charts/GraficoCanceladosVirTimeline';

export default function Dashboard() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const [empresaSelecionada, setEmpresaSelecionada] = useState(() => {
    return localStorage.getItem('empresaSelecionada') || '';
  });


    // 🔥 Novos estados para saber se há tarefas
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
        <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={{ base: 3, md: 4, lg: 7 }} spacingY={{ base: 2, md: 3 }}>
          <GridItem w="full" maxW="400px">
            <GraficoStatusClientes />
          </GridItem>
          <GridItem w="full" maxW="400px">
            <GraficoClientesAtivadosComparativo />
          </GridItem>
          <GridItem w="full" maxW="400px">
            <OrdensExecucaoCard />
          </GridItem>
          
          {/* WRAPPER das ONUs + Tarefas */}
          <GridItem w="full" maxW="400px" mx="auto">
            <Box>
              <StatusOnusCard />
              <TarefasAtrasadasCard setTemAtrasadas={setTemAtrasadas} />
              <TarefasNaoAtrasadasCard setTemNaoAtrasadas={setTemNaoAtrasadas} />
            </Box>
          </GridItem>

        </SimpleGrid>

        )}
      </Box>

      <BottomBar />
    </Box>
  );
}
