import { 
  Box, VStack, Heading, Input, Button, useToast, Textarea, Text, Flex, Icon, useColorModeValue 
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import SideBar from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';
import { FcGoogle } from 'react-icons/fc';
import { CheckCircleIcon } from '@chakra-ui/icons';

export default function GoogleCalendarIntegration() {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenEmail, setTokenEmail] = useState('');
  const toast = useToast();

  const bgBox = useColorModeValue('white', 'gray.800'); // Ajuste aqui
  const borderColor = useColorModeValue('gray.200', 'gray.600'); // Borda adaptativa
  const textColorPrimary = useColorModeValue('gray.700', 'gray.100'); 
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400'); 
  const badgeBg = useColorModeValue('green.50', 'green.900'); 

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario?.idUnico;
  const userEmail = usuario?.email;

  const fetchToken = async () => {
    try {
      const response = await fetch(`https://api.google.calendar.nexusnerds.com.br/google-token/${unicID_user}`);
      const data = await response.json();
      setIsAuthenticated(!!data.google_access_token);
      if (data.email) setTokenEmail(data.email);
    } catch (error) {
      console.error('Erro ao buscar token:', error);
      setIsAuthenticated(false);
      toast({
        title: 'Erro ao buscar token',
        description: 'Não foi possível recuperar o token do servidor.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch(`https://api.google.calendar.nexusnerds.com.br/google-token/${unicID_user}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Erro ao desconectar');
      setIsAuthenticated(false);
      setTokenEmail('');
      toast({
        title: 'Desconectado com sucesso!',
        description: 'Sua conta foi desconectada.',
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Tente novamente.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />
      <Box position="fixed" top="20px" right="24px" zIndex={30} display={{ base: 'none', md: 'block' }}>
        <PerfilUsuarioDesktop usuario={usuario} />
      </Box>

      <Box flex="1" px={{ base: 4, md: 6 }} pt={{ base: 4, md: 6 }} pb={{ base: 24, md: 6 }} minH="100vh" overflowX="hidden" overflowY="auto">
        <Heading fontSize={{ base: 'xl', md: '2xl' }} mb={6}>
          Integração com Google Calendar
        </Heading>

        <VStack spacing={6} align="stretch" maxW="md" mx="auto">
          <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="md" bg={bgBox} borderColor={borderColor}>
            <Heading size="sm" mb={4}>Autenticar com Google</Heading>
            {!isAuthenticated ? (
              <Button colorScheme="blue" onClick={() => window.location.href = `https://api.google.calendar.nexusnerds.com.br/auth/google?email=${encodeURIComponent(userEmail)}`} leftIcon={<FcGoogle />} w="full">
                Login com Google
              </Button>
            ) : (
              <Flex align="center" justify="space-between">
                <Flex align="center">
                  <Icon as={CheckCircleIcon} color="green.500" mr={2} />
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColorPrimary}>
                      Autenticado com sucesso!
                    </Text>
                    <Text fontSize="sm" color={textColorSecondary} bg={badgeBg} px={2} py={1} borderRadius="md" mt={1}>
                      Email: {tokenEmail || userEmail}
                    </Text>
                  </Box>
                </Flex>
                <Button colorScheme="red" onClick={handleDisconnect} size="sm">
                  Desconectar
                </Button>
              </Flex>
            )}
            {!isAuthenticated && (
              <Text fontSize="sm" color="red.500" mt={3}>
                Não autenticado. Faça login com o Google.
              </Text>
            )}
          </Box>
        </VStack>
      </Box>

      <BottomBar />
    </Box>
  );
}
