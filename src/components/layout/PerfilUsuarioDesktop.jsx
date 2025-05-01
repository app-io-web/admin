import {
  Avatar,
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
  useColorModeValue,
  Text,
  VStack
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export default function PerfilUsuarioDesktop({ usuario }) {
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const navigate = useNavigate();

  const bgMenu = useColorModeValue('white', 'rgba(30, 41, 59, 0.85)');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100');
  const nameColor = useColorModeValue('gray.800', 'white');
  const emailColor = useColorModeValue('gray.500', 'gray.400');
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.100');
  const textColor = useColorModeValue('gray.800', 'white');
  const logoutColor = useColorModeValue('red.500', 'red.400');

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  if (!isDesktop) return null;

  return (
    <Box position="absolute" top={4} right={6}>
      <Menu>
        <MenuButton
          as={Box}
          display="flex"
          alignItems="center"
          cursor="pointer"
          _hover={{ opacity: 0.9 }}
        >
          <Avatar
            size="sm"
            name={usuario?.nome || 'Usuário'}
            src={usuario?.fotoUrl}
          />
        </MenuButton>

        <MenuList
          bg={bgMenu}
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="lg"
          borderRadius="md"
          px={2}
        >
          <Box px={3} py={2} borderBottom="1px solid" borderColor={borderColor}>
            <Text fontWeight="bold" fontSize="sm" color={nameColor}>
              {usuario?.nome || 'Usuário'}
            </Text>
            <Text fontSize="xs" color={emailColor}>
              {usuario?.email || 'sem@email.com'}
            </Text>
          </Box>

          <VStack align="stretch" spacing={1} py={2}>
            <MenuItem borderRadius="md" _hover={{ bg: hoverBg }} color={textColor}>
              Perfil
            </MenuItem>
            <MenuItem borderRadius="md" _hover={{ bg: hoverBg }} color={textColor}>
              Configurações
            </MenuItem>
            <MenuItem
              borderRadius="md"
              _hover={{ bg: logoutColor, color: 'white' }}
              color={logoutColor}
              onClick={handleLogout}
            >
              Sair
            </MenuItem>
          </VStack>
        </MenuList>
      </Menu>
    </Box>
  );
}
