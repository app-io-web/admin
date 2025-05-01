import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Checkbox,
    Text,
    useToast,
    Avatar,
    Flex,
    Box,
  } from '@chakra-ui/react';
  import { useState } from 'react';
  
  const CreateGroupModal = ({ isOpen, onClose, usuariosDisponiveis, socket, meuID, setConversas }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const toast = useToast();
  
    const handleUserSelection = (userId) => {
      setSelectedUsers((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    };
  
    const handleCreateGroup = () => {
      if (!groupName.trim()) {
        toast({
          title: 'Erro',
          description: 'O nome do grupo é obrigatório.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      if (selectedUsers.length < 2) {
        toast({
          title: 'Erro',
          description: 'Selecione pelo menos 2 usuários para criar um grupo.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      const groupId = `group_${Date.now()}`; // ID único temporário para o grupo
      const groupMembers = [...selectedUsers, meuID]; // Inclui o criador no grupo
  
      // Criar o grupo localmente
      const groupInfo = {
        id: groupId,
        name: groupName,
        members: groupMembers,
        isGroup: true,
        timestamp: new Date().toISOString(),
      };
  
      // Adicionar o grupo à lista de conversas
      setConversas((prev) => ({
        ...prev,
        [groupId]: [
          {
            tipo: 'sistema',
            texto: `Grupo "${groupName}" criado!`,
            timestamp: new Date().toISOString(),
          },
        ],
      }));
  
      // Emitir evento para o servidor via socket
      socket.emit('criar_grupo', {
        groupId,
        groupName,
        members: groupMembers,
        creator: meuID,
      });
  
      toast({
        title: 'Grupo Criado',
        description: `O grupo "${groupName}" foi criado com sucesso!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
  
      // Limpar o estado e fechar o modal
      setGroupName('');
      setSelectedUsers([]);
      onClose();
    };
  
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Criar Novo Grupo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Nome do Grupo</FormLabel>
                <Input
                  placeholder="Digite o nome do grupo"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </FormControl>
  
              <FormControl>
                <FormLabel>Selecionar Participantes</FormLabel>
                <VStack align="stretch" maxH="300px" overflowY="auto" spacing={2}>
                  {usuariosDisponiveis.map((user) => (
                    <Flex
                      key={user.UnicID_User}
                      align="center"
                      p={2}
                      borderRadius="md"
                      _hover={{ bg: 'gray.100' }}
                    >
                      <Checkbox
                        isChecked={selectedUsers.includes(user.UnicID_User)}
                        onChange={() => handleUserSelection(user.UnicID_User)}
                        mr={3}
                      />
                      <Avatar size="sm" src={user.pic_profile_link} mr={2} />
                      <Box>
                        <Text fontWeight="bold">{user.name || 'Usuário Desconhecido'}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {user.user_login || 'Sem login'}
                        </Text>
                      </Box>
                    </Flex>
                  ))}
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>
  
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleCreateGroup}>
              Criar Grupo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  export default CreateGroupModal;