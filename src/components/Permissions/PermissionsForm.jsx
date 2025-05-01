import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Stack,
  Spinner,
  useToast,
  Image,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
} from '@chakra-ui/react';
import { FaUserCircle } from 'react-icons/fa'; // Ícone de foto
import { useNavigate } from 'react-router-dom'; // Importe o useNavigate
import { usePermissions } from '../../context/PermissionsContext'; // Importar o contexto de permissões

export default function PermissionsForm() {
  const [recentUsers, setRecentUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions(); // Usar o hook de permissões
  const canAccessPermissions = hasPermission('PERM-[ADMIN-ACESSO-PERMISSOES]'); // Verificar permissão

  // Função para formatar a data
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Função para buscar os 3 usuários mais recentes
  useEffect(() => {
    fetchRecentUsers(); // Buscar os usuários recentes quando o componente for carregado
  }, []);

  const fetchRecentUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://nocodb.nexusnerds.com.br/api/v2/tables/mn8xn7q4lsvk963/records?sort=-AtCreated&limit=3',
        {
          headers: {
            'xc-token': 'PQFnWUYFjMfX7aAVow3zO11oNhyvQugsPoYWDVw6',
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data?.list?.length > 0) {
        setRecentUsers(data.list);
      } else {
        console.log('Nenhum usuário encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários recentes', error);
      toast({
        title: 'Erro ao buscar usuários recentes',
        description: 'Não foi possível carregar os usuários recentes.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user); // Armazenando o usuário selecionado
    setIsModalOpen(true); // Abre o modal
  };

  // Função para fechar o modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleAccessPermissionsPage = () => {
    console.log('Passando para a página de permissões: ', selectedUser); // console.log para depuração
    navigate(`/permissions/${selectedUser?.UnicID_User}`, { state: { userDetails: selectedUser } }); // Passando detalhes do usuário via 'state'
  };

  return (
    <Box p={6} borderWidth={1} borderRadius="lg">
      {isLoading ? (
        <Spinner size="lg" />
      ) : (
        <Box mt={6}>
          <Heading size="md" mb={4}>Últimos 3 Usuários Criados</Heading>
          <Stack spacing={4} mt={2}>
            {recentUsers.length === 0 ? (
              <Box>Nenhum usuário encontrado.</Box>
            ) : (
              recentUsers.map((user, index) => (
                <Box
                  key={index}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  boxShadow="md"
                  onClick={() => handleUserClick(user)}
                  cursor="pointer"
                >
                  <Box mr={4}>
                    {user.pic_profile_link ? (
                      <Image
                        boxSize="50px"
                        borderRadius="full"
                        src={user.pic_profile_link}
                        alt="Foto de Perfil"
                        fallbackSrc="https://via.placeholder.com/50"
                      />
                    ) : (
                      <Icon as={FaUserCircle} w={12} h={12} color="gray.400" />
                    )}
                  </Box>
                  <Box>
                    <Box>
                      <strong>{user.name}</strong>
                    </Box>
                    <Box>Email: {user['email-login']}</Box>
                    <Box>Data de Criação: {formatDate(user.AtCreated)}</Box>
                  </Box>
                </Box>
              ))
            )}
          </Stack>
        </Box>
      )}

      {/* Modal para exibir a mensagem e o botão de redirecionamento */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Permissões de {selectedUser?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box display="flex" alignItems="center" mb={4}>
              {selectedUser?.pic_profile_link ? (
                <Image
                  boxSize="50px"
                  borderRadius="full"
                  src={selectedUser.pic_profile_link}
                  alt="Foto de Perfil"
                  fallbackSrc="https://via.placeholder.com/50"
                />
              ) : (
                <Icon as={FaUserCircle} w={12} h={12} color="gray.400" />
              )}
              <Box ml={4}>
                <Box>
                  <strong>{selectedUser?.name}</strong>
                </Box>
                <Box>Email: {selectedUser?.['email-login']}</Box>
                <Box>Data de Criação: {formatDate(selectedUser?.AtCreated)}</Box>
              </Box>
            </Box>

            {canAccessPermissions ? (
              <Text>Você pode acessar a página de permissões para {selectedUser?.name} clicando no botão abaixo.</Text>
            ) : (
              <Text fontSize="sm" color="gray.500">
                Você não tem permissão para gerenciar permissões.
              </Text>
            )}
          </ModalBody>

          <ModalFooter gap={4}>
            {canAccessPermissions ? (
              <Button colorScheme="teal" onClick={handleAccessPermissionsPage}>
                Acessar Página de Permissões
              </Button>
            ) : null}
            <Button colorScheme="gray" onClick={closeModal}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}