import { useState, useEffect } from 'react';
import { Box, Slide, useColorModeValue } from '@chakra-ui/react';
import ChatAreaFlutuante from './ChatAreaFlutuante';
import { registrarNotificacaoPush } from '../../utils/pushNotifications';


export default function ChatFlutuante() {
  const bgChat = useColorModeValue('#f7f7f7', 'gray.800');
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    console.log('ChatFlutuante montado. Estado inicial de aberto:', aberto);
  
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario?.UnicID_User) {
      registrarNotificacaoPush(usuario.UnicID_User);
    }
  }, []);

  useEffect(() => {
    console.log('Estado aberto alterado para:', aberto);
  }, [aberto]);

  useEffect(() => {
    if (aberto) {
      console.log('Slide está sendo renderizado porque aberto é true');
    } else {
      console.log('Slide não deveria estar visível porque aberto é false');
    }
  }, [aberto]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'ABRIR_CHAT') {
          console.log('🔔 Recebida mensagem do SW para abrir o chat');
          setAberto(true);
        }
      });
    }
  }, []);
  

  return (
    <>
      {/* Botão flutuante (apenas visível quando o chat está fechado) */}
      {!aberto && (
        <Box
          position="fixed"
          bottom="80px"
          right="24px"
          zIndex="popover"
          as="button"
          onClick={() => {
            console.log('Botão clicado. Alterando estado de aberto para:', !aberto);
            setAberto(true); // Apenas abre o chat
          }}
          bg="#2E7D32"
          color="white"
          borderRadius="10px"
          px="4"
          py="2"
          fontSize="md"
          fontWeight="bold"
          shadow="lg"
          _hover={{ bg: "#1B5E20" }}
          _active={{ bg: "#1B5E20" }}
          aria-label="Abrir chat"
        >
          Chat Integrado
        </Box>
      )}

      {/* Container do chat flutuante */}
      {aberto && (
        <Slide direction="bottom" in={aberto} style={{ zIndex: 1000 }}>
          <Box
            position="fixed"
            right="20px"
            bottom="20px"
            w={{ base: '95vw', sm: '380px', md: '400px' }}
            h="600px"
            bg={bgChat}
            borderRadius="2xl"
            boxShadow="0px 8px 24px rgba(0, 0, 0, 0.2)"
            display="flex"
            flexDirection="column"
            overflow="hidden"
            border="1px solid"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
          >
            <ChatAreaFlutuante
              onClose={() => {
                console.log('Fechando chat via onClose...');
                setAberto(false);
              }}
            />
          </Box>
        </Slide>
      )}
    </>
  );
}