import { Box, Input, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import UserItem from './UserItem';

const Sidebar = ({ usuariosDisponiveis, destinatario, setDestinatario, buscarHistoricoConversa, socket, meuID, setVisibleMessagesCount, digitandoUsuarios, setConversas, unreadMessages, setUnreadMessages }) => {
  const bgSidebar = useColorModeValue('linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%)', 'linear-gradient(180deg, #2D3748 0%, #1A202C 100%)');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      w="300px"
      bg={bgSidebar}
      p={4}
      borderRightWidth="1px"
      borderColor={borderColor}
      overflowY="auto"
      boxShadow="sm"
      transition="all 0.3s ease"
    >
      <Text
        fontWeight="bold"
        fontSize="2xl"
        mb={4}
        color={useColorModeValue('gray.800', 'white')}
        letterSpacing="wide"
      >
        Mensagens
      </Text>
      <Input
        placeholder="Buscar..."
        mb={4}
        bg={useColorModeValue('white', 'gray.700')}
        borderRadius="lg"
        boxShadow="sm"
        _focus={{ boxShadow: 'outline', borderColor: 'blue.400' }}
        transition="all 0.2s ease"
      />
      <VStack align="stretch" spacing={2}>
        {usuariosDisponiveis.map((user) => {
          const isSelected = destinatario
            ? (user.isGroup ? user.id === destinatario.id : user.UnicID_User === destinatario.UnicID_User)
            : false;

          return (
            <UserItem
              key={user.UnicID_User || user.id}
              user={user}
              isSelected={isSelected}
              onClick={() => {
                setDestinatario(user);
                buscarHistoricoConversa(meuID, user.UnicID_User || user.id, user.isGroup);
                socket.emit('visualizar_conversa', { de: meuID, para: user.UnicID_User || user.id, isGroup: user.isGroup });
                setVisibleMessagesCount(20);
                setUnreadMessages((prev) => ({
                  ...prev,
                  [user.UnicID_User || user.id]: 0,
                }));
              }}
              digitando={digitandoUsuarios[user.UnicID_User || user.id]}
              unreadCount={unreadMessages[user.UnicID_User || user.id] || 0}
            />
          );
        })}
      </VStack>
    </Box>
  );
};

export default Sidebar;