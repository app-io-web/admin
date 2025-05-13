import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  useToast,
  Text,
  useColorModeValue,
  Icon,
  Center,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Image,
} from '@chakra-ui/react';
import { AtSignIcon, LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import { login } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    const user = await login(email, senha);

    console.log('🔐 user retornado:', user); // VERIFICAR

    if (user) {
      const usuarioFormatado = {
        nome: user.name,
        email: user['email-login'],
        fotoUrl: user.pic_profile_link,
        tipo: user.type,
        empresa: user.company,
        idUnico: user.UnicID_User,
        telefone_whatsapp: user.telefone_whatsapp,
        data_nascimento: user.data_nascimento,
      };

      // ✅ Salva antes de qualquer navegação
      localStorage.setItem('usuario', JSON.stringify(usuarioFormatado));

      // ✅ Delay curto garante salvamento antes da próxima tela
      setTimeout(() => {
        navigate('/');
      }, 100); // ou use await Promise.resolve()
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
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgGradient = useColorModeValue(
    'linear(to-br, #ebf8ff, #bee3f8)',
    'linear(to-br, #1a202c, #2d3748)'
  );

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      width={{ base: '100%', md: '40vw' }}
    >
      <MotionBox
        bg={cardBg}
        p={10}
        borderRadius="2xl"
        shadow="dark-lg"
        border="1px solid"
        borderColor={borderColor}
        w="full"
        maxW="400px"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <VStack spacing={6} align="stretch">
          <Center>
            <Image src="/admin/logo.png" alt="Logo" boxSize="50px" />
          </Center>

          <Heading fontSize="2xl" textAlign="center" color="blue.500">
            Acesso ao Painel
          </Heading>

          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <AtSignIcon color="blue.400" />
            </InputLeftElement>
            <Input
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              focusBorderColor="blue.400"
              bg={inputBg}
              size="md"
              rounded="md"
            />
          </InputGroup>

          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <LockIcon color="blue.400" />
            </InputLeftElement>
            <Input
              placeholder="Senha"
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              focusBorderColor="blue.400"
              bg={inputBg}
              size="md"
              rounded="md"
            />
            <InputRightElement>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarSenha(!mostrarSenha)}
              >
                {mostrarSenha ? <ViewOffIcon /> : <ViewIcon />}
              </Button>
            </InputRightElement>
          </InputGroup>

          <Button
            colorScheme="blue"
            isLoading={loading}
            onClick={handleLogin}
            size="lg"
            w="full"
            rounded="full"
            shadow="md"
          >
            Entrar
          </Button>

            <Center mt={2}>
              <a
                href="https://www.instagram.com/dev_jot4l"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                <Text fontSize="xs" color="gray.500">
                  Desenvolvido por <b>dev_jot4l</b>
                </Text>
                <img src="/admin/verificado.png" alt="verificado" style={{ width: '14px', height: '14px' }} />
              </a>
            </Center>


        </VStack>
      </MotionBox>
    </Box>
  );
}
