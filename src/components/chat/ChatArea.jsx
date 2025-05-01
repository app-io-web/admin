import { Flex, Avatar, Box, Text, useColorModeValue } from '@chakra-ui/react';
import Messages from './Messages';
import MessageInput from './MessageInput';

const ChatArea = ({
  destinatario,
  conversas,
  replyingTo,
  setReplyingTo,
  handleReply,
  mensagensEndRef,
  mensagensVisualizadas,
  showUserInfo,
  deletarMensagem,
  visibleMessagesCount,
  loadMoreMessages,
  mensagem,
  setMensagem,
  enviarMensagem,
  handleFileChange,
  debouncedEnviarDigitando,
  handleAvatarClick,
  formatarSeparadorDia,
  renderTextWithLinks,
  formatarHora,
}) => {
  const bgChat = useColorModeValue('gray.50', 'gray.800');
  const headerBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Flex
      flex="1"
      direction="column"
      p={4}
      bg={bgChat}
      borderRadius="lg"
      boxShadow="md"
      transition="all 0.3s ease"
      minW="600px" // Largura mínima para garantir que o chat seja "grande"
      minH="600px" // Altura mínima para garantir que o chat tenha um tamanho considerável
    >
      {destinatario ? (
        <>
          <Flex
            align="center"
            mb={4}
            p={3}
            bg={headerBg}
            borderBottomWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            boxShadow="sm"
          >
            <Avatar
              size="md"
              src={destinatario.pic_profile_link}
              mr={3}
              cursor="pointer"
              onClick={() => handleAvatarClick(destinatario)}
              border="2px solid"
              borderColor={destinatario.online ? 'green.400' : 'gray.400'}
            />
            <Box>
              <Text fontWeight="bold" fontSize="lg" color={useColorModeValue('gray.800', 'white')}>
                {destinatario.name || 'Usuário Desconhecido'}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {destinatario.online ? 'Online' : 'Offline'}
              </Text>
            </Box>
          </Flex>

          <Messages
            lista={conversas[destinatario?.isGroup ? destinatario.id : destinatario?.UnicID_User] || []}
            destinatario={destinatario}
            replyingTo={replyingTo}
            handleReply={handleReply}
            mensagensEndRef={mensagensEndRef}
            formatarSeparadorDia={formatarSeparadorDia}
            formatarHora={formatarHora}
            renderTextWithLinks={renderTextWithLinks}
            mensagensVisualizadas={mensagensVisualizadas}
            corMinhaMensagem={useColorModeValue('black', 'white')}
            bgMinhaMensagem={useColorModeValue('blue.200', 'blue.600')}
            bgMensagem={useColorModeValue('gray.100', 'gray.700')}
            showUserInfo={showUserInfo}
            deletarMensagem={deletarMensagem}
            visibleMessagesCount={visibleMessagesCount}
            loadMoreMessages={loadMoreMessages}
            totalMessages={(conversas[destinatario?.isGroup ? destinatario.id : destinatario?.UnicID_User] || []).length}
          />

          <MessageInput
            mensagem={mensagem}
            setMensagem={setMensagem}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            enviarMensagem={enviarMensagem}
            handleFileChange={handleFileChange}
            debouncedEnviarDigitando={debouncedEnviarDigitando}
          />
        </>
      ) : (
        <Flex flex="1" align="center" justify="center">
          <Text color="gray.400" fontSize="lg" fontStyle="italic">
            Selecione um usuário para começar a conversar
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default ChatArea;