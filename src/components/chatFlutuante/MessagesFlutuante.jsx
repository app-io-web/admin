// src/components/chatFlutuante/MessagesFlutuante.jsx
import { memo } from 'react';
import { Box, VStack, Text, HStack, Flex, useColorModeValue } from '@chakra-ui/react';
import RenderTextWithLinks from '../../components/chat/RenderTextWithLinks';

const MessagesFlutuante = memo(({
  lista,
  destinatario,
  replyingTo,
  handleReply,
  mensagensEndRef,
  formatarSeparadorDia,
  formatarHora,
  ultimaMensagemLidaTimestamp // <-- NOVO
}) => {
  const separatorBg = useColorModeValue('gray.200', 'gray.600');

  return (
    <VStack
      maxW="100%"
      minH="350px"
      flex="1"
      p={2}
      spacing={2}
      overflowY="auto"
      sx={{
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { background: useColorModeValue('gray.100', 'gray.700') },
        '&::-webkit-scrollbar-thumb': { background: useColorModeValue('gray.400', 'gray.500'), borderRadius: 'full' },
      }}
    >
      {lista.map((msg, index, array) => {
        const atualDia = formatarSeparadorDia(msg.timestamp);
        const diaAnterior = index > 0 ? formatarSeparadorDia(array[index - 1].timestamp) : null;
        const messageId = `${msg.timestamp}-${index}`;
        const tipo = msg.tipo || msg.texto?.tipo || 'texto';
        const textoMensagem = typeof msg.texto === 'string' ? msg.texto : msg.texto?.texto || '';

        const urlAnexo = msg.url?.startsWith('/anexos/')
          ? msg.url
          : `/anexos/${msg.autor}/${msg.url}`;

          const isNovaMensagem =
          ultimaMensagemLidaTimestamp &&
          msg.autor !== 'eu' &&
          new Date(msg.timestamp) > new Date(ultimaMensagemLidaTimestamp) &&
          !array
            .slice(0, index)
            .some(
              (m) =>
                m.autor !== 'eu' &&
                new Date(m.timestamp) > new Date(ultimaMensagemLidaTimestamp)
            );
        
        

        return (
          <Box key={messageId} w="100%">
            {atualDia !== diaAnterior && (
              <Flex justify="center" my={3}>
                <Box bg={separatorBg} color="gray.600" fontSize="xs" px={3} py={1} borderRadius="full" boxShadow="sm">
                  {atualDia}
                </Box>
              </Flex>
            )}

            {isNovaMensagem && (
              <Flex justify="center" my={3}>
                <Box bg="blue.100" color="blue.800" fontSize="xs" px={3} py={1} borderRadius="full" boxShadow="sm">
                  Novas Mensagens
                </Box>
              </Flex>
            )}

            <HStack w="100%" justify={msg.autor === 'eu' ? 'flex-end' : 'flex-start'} spacing={2}>
              <Box
                bg={msg.autor === 'eu' ? 'blue.500' : 'gray.200'}
                color={msg.autor === 'eu' ? 'white' : undefined}
                px={4}
                py={2}
                borderRadius="lg"
                maxW="75%"
                boxShadow="sm"
                position="relative"
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

                {tipo === 'anexo' ? (
                  <Box fontSize="sm" wordBreak="break-word">
                    <a
                      href={`https://api.chat.nexusnerds.com.br${msg.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: msg.autor === 'eu' ? 'white' : 'blue', textDecoration: 'underline' }}
                    >
                      📎 {msg.nomeArquivo || 'Arquivo'}
                    </a>
                  </Box>
                ) : (
                  <Box fontSize="sm" wordBreak="break-word">
                    <RenderTextWithLinks texto={textoMensagem} />
                  </Box>
                )}

                <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
                  {formatarHora(msg.timestamp)}
                </Text>
              </Box>
            </HStack>
          </Box>
        );
      })}
      <div ref={mensagensEndRef} />
    </VStack>
  );
});

export default MessagesFlutuante;
