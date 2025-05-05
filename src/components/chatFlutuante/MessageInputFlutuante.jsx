// src/components/chatFlutuante/MessageInputFlutuante.jsx
import { useRef } from 'react';
import { Box, HStack, Input, IconButton, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import { FiSend, FiPaperclip, FiX, FiArrowLeft } from 'react-icons/fi';

const MessageInputFlutuante = ({ mensagem, setMensagem, replyingTo, setReplyingTo, enviarMensagem, handleFileChange, debouncedEnviarDigitando }) => {
  const fileInputRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      enviarMensagem();
    }
  };

  return (
    <Box px={2} pb={2}>
      {replyingTo && (
        <Flex align="center" bg={useColorModeValue('gray.200', 'gray.600')} p={2} mb={2} borderRadius="md">
          <FiArrowLeft size={16} />
          <Text fontSize="sm" ml={2} flex="1">
            Respondendo: {replyingTo.texto}
          </Text>
          <IconButton
            icon={<FiX />}
            size="sm"
            onClick={() => setReplyingTo(null)}
            aria-label="Cancelar resposta"
          />
        </Flex>
      )}
      <HStack spacing={2}>
        <IconButton
          icon={<FiPaperclip />}
          colorScheme="blue"
          onClick={() => fileInputRef.current.click()}
          aria-label="Anexar arquivo"
        />
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
        />
        <Input
          placeholder="Digite sua mensagem..."
          value={mensagem}
          onChange={(e) => {
            const valor = e.target.value;
            setMensagem(valor);
            if (valor.trim()) {
              debouncedEnviarDigitando(); // <-- Esse é o gatilho
            }
          }}
          onKeyDown={handleKeyPress}
          flex="1"
        />

        <IconButton
          icon={<FiSend />}
          colorScheme="blue"
          onClick={enviarMensagem}
          aria-label="Enviar"
        />
      </HStack>
    </Box>
  );
};

export default MessageInputFlutuante;
