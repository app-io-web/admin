import { Box, Heading, useColorModeValue } from '@chakra-ui/react';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';
import KanbanBoard from '../components/kanban/KanbanBoard';

export default function KanbanPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const bg = useColorModeValue('white', 'gray.900'); // White in light mode, gray.900 in dark mode to match theme

  return (
    <Box display="flex" minH="100vh" position="relative" overflowX="hidden" width="100%">
      <SideBar />

      <Box
        position="fixed"
        top="20px"
        right="24px"
        zIndex={30}
        display={{ base: 'none', sm: 'block' }}
      >
        <PerfilUsuarioDesktop usuario={usuario} />
      </Box>

      <Box
        flex="1"
        px={{ base: 4, sm: 6 }}
        pt={{ base: 4, sm: 6 }}
        pb={{ base: 24, sm: 6 }}
        minH="100vh"
        overflow="hidden"
        position="relative"
        width="100%"
        bg={bg}
      >
        <Heading fontSize={{ base: 'xl', sm: '2xl' }} mb={10}>
        </Heading>

        <Box
          overflowX="hidden"
          pr={{ base: 0, sm: '150px' }}
          minH="100%"
          width="100%"
        >
          <KanbanBoard />
        </Box>
      </Box>

      <BottomBar />
    </Box>
  );
}