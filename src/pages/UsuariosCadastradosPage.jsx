import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, SimpleGrid, Spinner, HStack, Icon, useColorModeValue,
  Button, Avatar, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Badge, VStack
} from '@chakra-ui/react';
import { FaSyncAlt, FaKey, FaEdit, FaBuilding, FaPhoneAlt, FaCalendarAlt, FaUserTag } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';

const API_URL = `${import.meta.env.VITE_NOCODB_URL}/api/v2/tables/mn8xn7q4lsvk963/records`;
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function UsuariosCadastradosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const bg = useColorModeValue('whiteAlpha.700', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.600');

  const fetchUsuarios = async () => {
    setCarregando(true);
    setErro('');
    try {
      const res = await fetch(API_URL, {
        headers: {
          'Content-Type': 'application/json',
          'xc-token': TOKEN,
        }
      });
      const json = await res.json();
      setUsuarios(json.list || []);
    } catch (err) {
      console.error(err);
      setErro('Erro ao buscar usuários.');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModal = (user) => {
    setUsuarioSelecionado(user);
    onOpen();
  };

const irParaPermissoes = () => {
  navigate(`/permissions/${usuarioSelecionado?.UnicID_User}`, {
    state: { userDetails: usuarioSelecionado }
  });
};


  const irParaEdicao = () => {
    navigate(`/editar-usuario/${usuarioSelecionado?.UnicID_User}`);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />

      <Box
        flex="1"
        px={{ base: 4, md: 6 }}
        pt={{ base: 4, md: 6 }}
        pb={{ base: 24, md: 6 }}
        overflowY="auto"
      >
        <Box
          position="fixed"
          top="20px"
          right="24px"
          zIndex={30}
          display={{ base: 'none', md: 'block' }}
        >
          <PerfilUsuarioDesktop usuario={usuario} />
        </Box>

        <HStack justify="space-between" mb={6} mt={{ base: 6, md: 0 }}>
          <Heading fontSize={{ base: 'xl', md: '2xl' }}>Usuários Cadastrados</Heading>
          <Button leftIcon={<FaSyncAlt />} onClick={fetchUsuarios} isLoading={carregando}>
            Atualizar
          </Button>
        </HStack>

        {carregando && <Spinner size="lg" />}
        {erro && <Text color="red.500">{erro}</Text>}

        {usuarios.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {usuarios.map((user, i) => (
              <Box
                key={i}
                p={4}
                borderWidth="1px"
                borderRadius="xl"
                bg="white"
                boxShadow="md"
                cursor="pointer"
                _hover={{ boxShadow: 'xl', bg: 'gray.50' }}
                onClick={() => abrirModal(user)}
              >
                <HStack mb={2} spacing={3}>
                  <Avatar size="md" src={user.pic_profile_link || undefined} name={user.name} />
                  <Box>
                    <Text fontWeight="bold" fontSize="lg">{user.name}</Text>
                    <Text fontSize="sm" color="gray.600">{user['email-login']}</Text>
                  </Box>
                </HStack>

                <HStack spacing={2} mt={2}>
                  <Icon as={FaUserTag} color="pink.400" />
                  <Text fontSize="sm">{user.type}</Text>
                </HStack>

                <HStack spacing={2} mt={1} align="start">
                  <Icon as={FaBuilding} color="blue.500" mt="1px" />
                  <VStack align="start" spacing={1}>
                    {(user.company || '').split(',').map((empresa, idx) => (
                      <Badge key={idx} colorScheme="blue" variant="subtle" fontSize="0.7rem">
                        {empresa.trim()}
                      </Badge>
                    ))}
                  </VStack>
                </HStack>

                <HStack spacing={2} mt={2}>
                  <Icon as={FaPhoneAlt} color="purple.500" />
                  <Text fontSize="sm">{user.telefone_whatsapp}</Text>
                </HStack>

                <HStack spacing={2} mt={1}>
                  <Icon as={FaCalendarAlt} color="gray.500" />
                  <Text fontSize="xs" color="gray.500">
                    Criado em: {new Date(user.AtCreated).toLocaleDateString('pt-BR')}
                  </Text>
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          !carregando && <Text color="gray.500">Nenhum usuário encontrado.</Text>
        )}

        {/* Modal com ações */}
        {usuarioSelecionado && (
          <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Gerenciar Usuário</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text><strong>Nome:</strong> {usuarioSelecionado.name}</Text>
                <Text><strong>Email:</strong> {usuarioSelecionado['email-login']}</Text>
                <Text><strong>Tipo:</strong> {usuarioSelecionado.type}</Text>
                <Text><strong>Empresa:</strong> {usuarioSelecionado.company}</Text>
              </ModalBody>
              <ModalFooter justifyContent="space-between">
                <Button colorScheme="teal" leftIcon={<FaKey />} onClick={irParaPermissoes}>
                  Permissões
                </Button>
                <Button colorScheme="blue" leftIcon={<FaEdit />} onClick={irParaEdicao}>
                  Editar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </Box>

      <BottomBar />
    </Box>
  );
}
