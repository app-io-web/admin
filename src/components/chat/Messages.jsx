import { memo } from 'react';
import { Box, VStack, Text, HStack, Flex, Button, IconButton, useColorModeValue } from '@chakra-ui/react';
import { FiTrash2 } from 'react-icons/fi';

// Função para transformar URLs em links clicáveis
const renderTextWithLinks = (text) => {
  // Expressão regular para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Divide o texto em partes, transformando URLs em elementos <a>
  const parts = text.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'blue', textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });

  return parts;
};

const Messages = memo(({ lista, destinatario, replyingTo, handleReply, mensagensEndRef, formatarSeparadorDia, formatarHora, mensagensVisualizadas, corMinhaMensagem, bgMinhaMensagem, bgMensagem, showUserInfo, deletarMensagem, visibleMessagesCount, loadMoreMessages, totalMessages }) => {
  const canLoadMore = visibleMessagesCount < totalMessages;
  const separatorBg = useColorModeValue('gray.200', 'gray.600');

  return (
    <VStack
      maxW={'100%'}
      minW={showUserInfo ? '200px' : '400px'}
      minH="450px"
      flex="1"
      p={4}
      spacing={2}
      overflowY="auto"
      mb={4}
      transition="max-width 0.3s ease"
      sx={{
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-track': { background: useColorModeValue('gray.100', 'gray.700') },
        '&::-webkit-scrollbar-thumb': { background: useColorModeValue('gray.400', 'gray.500'), borderRadius: 'full' },
      }}
    >
      {canLoadMore && (
        <Flex justify="center" my={2}>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            borderRadius="full"
            _hover={{ bg: 'blue.50' }}
            transition="all 0.2s ease"
            onClick={loadMoreMessages}
          >
            Carregar mais mensagens
          </Button>
        </Flex>
      )}
      {lista.slice(-visibleMessagesCount).map((msg, index, array) => {
        const atualDia = formatarSeparadorDia(msg.timestamp);
        const diaAnterior = index > 0 ? formatarSeparadorDia(array[index - 1].timestamp) : null;
        const messageId = `${msg.timestamp}-${index}`;

        const messageDate = new Date(msg.timestamp);
        const now = new Date();
        const timeDiff = (now.getTime() - messageDate.getTime()) / 1000 / 60;
        const canDelete = msg.autor === 'eu' && timeDiff <= 3 && msg.tipo !== 'sistema';

        return (
          <Box key={messageId} w="100%">
            {atualDia !== diaAnterior && (
              <Flex justify="center" my={3}>
                <Box bg={separatorBg} color="gray.600" fontSize="xs" px={3} py={1} borderRadius="full" boxShadow="sm">
                  {atualDia}
                </Box>
              </Flex>
            )}
            {msg.tipo === 'sistema' ? (
              <Flex justify="center" my={2}>
                <Text fontSize="xs" color="gray.500" fontStyle="italic" bg="gray.100" px={3} py={1} borderRadius="lg">
                  {msg.texto}
                </Text>
              </Flex>
            ) : (
              <HStack w="100%" justify={msg.autor === 'eu' ? 'flex-end' : 'flex-start'} spacing={2}>
                <Box
                  bg={msg.autor === 'eu' ? bgMinhaMensagem : bgMensagem}
                  color={msg.autor === 'eu' ? corMinhaMensagem : undefined}
                  px={4}
                  py={2}
                  borderRadius="lg"
                  maxW="70%"
                  boxShadow="sm"
                  position="relative"
                  _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
                  transition="all 0.2s ease"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleReply(msg, index);
                  }}
                >
                  {msg.replyTo && (
                    <Box
                      bg={useColorModeValue('gray.200', 'gray.600')}
                      p={2}
                      borderRadius="md"
                      mb={2}
                      fontSize="xs"
                      borderLeftWidth="3px"
                      borderLeftColor="blue.400"
                    >
                      <Text color="gray.600">{msg.replyTo.texto}</Text>
                    </Box>
                  )}
                  {msg.tipo === 'anexo' ? (
                    <>
                      {msg.mimeType.startsWith('image/') ? (
                        <img src={`http://localhost:4007${msg.url}`} alt={msg.nomeArquivo} style={{ maxWidth: '200px', borderRadius: '8px' }} />
                      ) : msg.mimeType.startsWith('video/') ? (
                        <video controls preload="metadata" style={{ maxWidth: '200px', borderRadius: '8px' }}>
                          <source src={`http://localhost:4007${msg.url}`} type={msg.mimeType} />
                          Seu navegador não suporta o elemento de vídeo.
                        </video>
                      ) : (
                        <a href={`http://localhost:4007${msg.url}`} download={msg.nomeArquivo} style={{ color: 'blue', textDecoration: 'underline' }}>
                          {msg.nomeArquivo}
                        </a>
                      )}
                    </>
                  ) : (
                    <Text fontSize="sm" mb={1} wordBreak="break-word">
                      {renderTextWithLinks(msg.texto)}
                    </Text>
                  )}
                  <HStack justify="space-between" align="center">
                    <Text fontSize="xs" color="gray.500" display="flex" alignItems="center" gap={1}>
                      {formatarHora(msg.timestamp)}
                      {msg.autor === 'eu' && (
                        <>
                          {mensagensVisualizadas[destinatario?.isGroup ? destinatario.id : destinatario?.UnicID_User] ? (
                            <>
                              <Text as="span" fontSize="xs" color="blue.400">✓</Text>
                              <Text as="span" fontSize="xs" color="blue.400">✓</Text>
                            </>
                          ) : (
                            <Text as="span" fontSize="xs" color="gray.400">✓</Text>
                          )}
                        </>
                      )}
                    </Text>
                    {canDelete && (
                      <IconButton
                        icon={<FiTrash2 />}
                        size="xs"
                        colorScheme="red"
                        variant="ghost"
                        _hover={{ bg: 'red.100' }}
                        onClick={() => deletarMensagem(messageId, destinatario.isGroup ? destinatario.id : destinatario.UnicID_User)}
                        aria-label="Deletar mensagem"
                      />
                    )}
                  </HStack>
                </Box>
              </HStack>
            )}
          </Box>
        );
      })}
      <div ref={mensagensEndRef} />
    </VStack>
  );
});

// Removendo a prop padrão para forçar o uso da nossa função renderTextWithLinks
Messages.defaultProps = {};

export default Messages;