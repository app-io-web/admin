import {
    Box,
    Flex,
    IconButton,
    useColorMode,
    useColorModeValue,
    VStack,
    Text,
    Button
  } from '@chakra-ui/react';
  import { MoonIcon, SunIcon } from '@chakra-ui/icons';
  
  export default function LayoutAdmin({ children }) {
    const { colorMode, toggleColorMode } = useColorMode();
    const bg = useColorModeValue('gray.100', 'gray.800');
  
    return (
      <Flex height="100vh" bg={bg}>
        {/* Sidebar */}
        <VStack w="250px" bg={useColorModeValue('white', 'gray.700')} p={4} spacing={6} shadow="md">
          <Text fontSize="2xl" fontWeight="bold">Admin</Text>
          <Button w="full" variant="ghost">Dashboard</Button>
          <Button w="full" variant="ghost">Usuários</Button>
          <Button w="full" variant="ghost">Configurações</Button>
          <IconButton
            mt="auto"
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
          />
        </VStack>
  
        {/* Conteúdo principal */}
        <Box flex="1" p={6} overflow="auto">
          {children}
        </Box>
      </Flex>
    );
  }
  