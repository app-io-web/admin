import { Box } from '@chakra-ui/react';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';
import AtalhosPessoais from '../components/atalhos/AtalhosPessoais';

export default function AtalhosPessoaisPage() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};

  return (
    <Box display="flex" minH="100vh">
      <SideBar />

      <Box flex="1" p={4}>
        <PerfilUsuarioDesktop usuario={usuario} />
        <AtalhosPessoais />
      </Box>

      <BottomBar />
    </Box>
  );
}