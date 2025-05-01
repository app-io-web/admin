import {
    Box,
    Button,
    Input,
    VStack,
    Heading,
    useToast,
    Text,
    useColorModeValue
  } from '@chakra-ui/react';
  import { useState } from 'react';
  import { login } from '../services/authService';
  import { useNavigate } from 'react-router-dom';
  
  export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();
    
  
    const handleLogin = async () => {
        setLoading(true);
        const user = await login(email, senha);
      
        if (user) {
          const usuarioFormatado = {
            nome: user.name,
            email: user['email-login'],
            fotoUrl: user.pic_profile_link,
            tipo: user.type,
            empresa: user.company,
            idUnico: user.UnicID_User,
            telefone_whatsapp: user.telefone_whatsapp,
            data_nascimento: user.data_nascimento
          };
      
          localStorage.setItem('usuario', JSON.stringify(usuarioFormatado));
          navigate('/');
        } else {
          toast({
            title: 'Credenciais inválidas.',
            description: 'Verifique seu e-mail e senha.',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
        }
      
        setLoading(false);
      };
      
  
    const cardBg = useColorModeValue('white', 'gray.800');
    const pageBg = useColorModeValue('gray.50', 'gray.900');
  
    return (
      <Box
        minH="100vh"
        bg={pageBg}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
      >
        <Box
          bg={cardBg}
          p={8}
          rounded="lg"
          shadow="xl"
          w="full"
          maxW="sm"
          transition="all 0.2s"
        >
          <VStack spacing={4} align="stretch">
            <Heading size="lg" textAlign="center">Login</Heading>
  
            <Input
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              focusBorderColor="blue.400"
              bg={useColorModeValue('gray.100', 'gray.700')}
              _placeholder={{ color: 'gray.500' }}
            />
  
            <Input
              placeholder="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              focusBorderColor="blue.400"
              bg={useColorModeValue('gray.100', 'gray.700')}
              _placeholder={{ color: 'gray.500' }}
            />
  
            <Button
              colorScheme="blue"
              isLoading={loading}
              onClick={handleLogin}
              w="full"
              size="lg"
            >
              Entrar
            </Button>
  
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Desenvolvido por Max Tecnologia 🚀
            </Text>
          </VStack>
        </Box>
      </Box>
    );
  }
  