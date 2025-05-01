import { useState } from 'react';
import { Box, Grid } from '@chakra-ui/react';
import FormCreateUser from '../components/createUser/FormCreateUser';
import PermissionsForm from '../components/Permissions/PermissionsForm';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';

export default function CreateUserPage() {
  return (
    <Grid
      templateColumns={{ base: '1fr', md: '250px 1fr 400px' }}
      templateRows="auto 1fr auto"
      minH="100vh"
      maxW="100vw"
      overflowX="hidden"
      sx={{
        '& > *': {
          boxSizing: 'border-box',
        },
      }}
    >
      {/* Barra lateral */}
      <SideBar />

      <Box
        gridColumn={{ base: '1', md: '2' }}
        px={{ base: 4, md: 6 }}
        pt={{ base: 4, md: 6 }}
        pb={{ base: 24, md: 6 }}
        minH="100vh"
        overflowX="hidden"
        overflowY="auto"
        display="flex"
        flexDirection="column"
        maxW="100%"
      >
        <Box
          mb={6}
          position={{ base: 'static', md: 'fixed' }}
          top="20px"
          right="24px"
          zIndex={30}
          display={{ base: 'none', md: 'block' }}
        >
          <PerfilUsuarioDesktop
            usuario={JSON.parse(localStorage.getItem('usuario')) || {}}
          />
        </Box>

        {/* Formulário de Criação de Usuário */}
        <Box mb={6} flex="1" maxW="100%" overflowX="hidden">
          <FormCreateUser />
        </Box>

        {/* Componente de Permissões no Mobile */}
        <Box
          display={{ base: 'block', md: 'none' }}
          p={2}
          mt={6}
          maxW="100%"
          overflowX="hidden"
        >
          <PermissionsForm />
        </Box>
      </Box>

      {/* Componente de Permissões no Desktop */}
      <Box
        gridColumn={{ base: '1', md: '3' }}
        p={2}
        display={{ base: 'none', md: 'block' }}
        mt={{ base: 4, md: 16 }}
        maxW="100%"
        overflowX="hidden"
      >
        <PermissionsForm />
      </Box>

      {/* Barra inferior */}
      <BottomBar />
    </Grid>
  );
}