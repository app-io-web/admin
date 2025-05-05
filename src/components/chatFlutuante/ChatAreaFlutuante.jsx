import { useState, useEffect, useRef } from 'react';
import { Box, VStack, Text, Flex, IconButton, HStack } from '@chakra-ui/react';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import SidebarFlutuante from './SidebarFlutuante';
import MessagesFlutuante from './MessagesFlutuante';
import MessageInputFlutuante from './MessageInputFlutuante';
import { socket, formatarHora, formatarSeparadorDia, debounce } from '../../components/chat/utils';

// Carregar o arquivo de som
const notificationSound = new Audio();
notificationSound.src = '/admin/notification.mp3';
notificationSound.onerror = () => {
  console.error('Falha ao carregar MP3, tentando OGG...');
  notificationSound.src = '/admin/notification.ogg';
};

export default function ChatAreaFlutuante({ onClose }) {
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState([]);
  const [destinatario, setDestinatario] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [conversas, setConversas] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [digitandoUsuarios, setDigitandoUsuarios] = useState({});
  const [ultimaMensagemLidaTimestamp, setUltimaMensagemLidaTimestamp] = useState(null);
  const [mensagensVisualizadas, setMensagensVisualizadas] = useState({});
  const [carregouStorage, setCarregouStorage] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});

  useEffect(() => {
    const conversasSalvas = localStorage.getItem('chat_conversas');
    if (conversasSalvas) setConversas(JSON.parse(conversasSalvas));
    setCarregouStorage(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_conversas', JSON.stringify(conversas));
  }, [conversas]);

  useEffect(() => {
    localStorage.setItem('chat_mensagens_visualizadas', JSON.stringify(mensagensVisualizadas));
  }, [mensagensVisualizadas]);

  const mensagensEndRef = useRef(null);

  const meuID = JSON.parse(localStorage.getItem('usuario'))?.idUnico;

  useEffect(() => {
    if (destinatario) {
      setUltimaMensagemLidaTimestamp(new Date().toISOString());
    }
  }, [destinatario]);

  const buscarUsuariosDoBanco = async () => {
    try {
      const res = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/mn8xn7q4lsvk963/records`, {
        headers: {
          'xc-token': import.meta.env.VITE_NOCODB_TOKEN,
        },
      });
      const data = await res.json();
      const usuarios = data?.list || [];
      const filtrados = usuarios
        .filter((u) => u.UnicID_User !== meuID)
        .map((u) => ({
          ...u,
          name: u.name || u.email-login || u.user_login || u.UnicID_User || 'Usuário Sem Nome',
          id: u.UnicID_User,
          pic_profile_link: u.pic_profile_link || '',
          online: false,
          isGroup: false,
        }));
      setUsuariosDisponiveis(filtrados);

      for (const usuario of filtrados) {
        await buscarHistoricoConversa(usuario);
      }
    } catch (err) {
      console.error('[ChatAreaFlutuante] Erro ao buscar usuários do NocoDB:', err);
    }
  };

  const buscarHistoricoConversa = async (usuario) => {
    const destinatarioID = usuario.isGroup ? usuario.id : usuario.UnicID_User;
    if (usuario.isGroup) {
      try {
        const res = await fetch(`https://api.chat.nexusnerds.com.br/group/${destinatarioID}`);
        const data = await res.json();
        const historicoFormatado = (data || []).map((msg) => {
          let mensagemFormatada = { tipo: 'texto', texto: '' };
          if (typeof msg.texto === 'string') {
            try {
              const parsed = JSON.parse(msg.texto);
              mensagemFormatada = { ...mensagemFormatada, ...parsed };
            } catch {
              mensagemFormatada.texto = msg.texto;
            }
          }
          return {
            ...mensagemFormatada,
            autor: msg.autor === meuID ? 'eu' : msg.autor,
            timestamp: msg.timestamp,
            replyTo: msg.replyTo || null,
          };
        });
        setConversas((prev) => ({
          ...prev,
          [destinatarioID]: historicoFormatado,
        }));
      } catch (error) {
        console.error('Erro ao buscar histórico do grupo:', error);
      }
    } else {
      const idsOrdenados = [meuID, destinatarioID].sort();
      try {
        const res = await fetch(`https://api.chat.nexusnerds.com.br/chat/${idsOrdenados[0]}/${idsOrdenados[1]}`);
        const data = await res.json();
        const historicoFormatado = (data || []).map((msg) => {
          let mensagemFormatada;
          try {
            mensagemFormatada = JSON.parse(msg.texto);
          } catch (e) {
            mensagemFormatada = { tipo: 'texto', texto: msg.texto };
          }
          return {
            ...mensagemFormatada,
            autor: msg.autor === meuID ? 'eu' : msg.autor,
            timestamp: msg.timestamp,
            replyTo: msg.replyTo || null,
          };
        });
        setConversas((prev) => ({
          ...prev,
          [destinatarioID]: historicoFormatado,
        }));
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      }
    }
  };

  

  useEffect(() => {
    buscarUsuariosDoBanco();
  }, []);

  useEffect(() => {
    if (carregouStorage && destinatario) {
      buscarHistoricoConversa(destinatario);
    }
  }, [destinatario, carregouStorage]);

  useEffect(() => {
    const carregarUltimaLida = async () => {
      const idAtual = destinatario?.isGroup ? destinatario.id : destinatario?.UnicID_User;
      const res = await fetch(`https://api.chat.nexusnerds.com.br/chat/ultima-lida/${meuID}/${idAtual}`);
      const data = await res.json();
      setUltimaMensagemLidaTimestamp(data.timestamp || null);
    };

    if (destinatario) {
      carregarUltimaLida();
    }
  }, [destinatario]);

  useEffect(() => {
    const marcarComoLido = async () => {
      const idAtual = destinatario?.isGroup ? destinatario.id : destinatario?.UnicID_User;
      const mensagens = conversas[idAtual] || [];
      const ultimaMensagem = mensagens[mensagens.length - 1];
      if (!ultimaMensagem) return;
  
      await fetch(`https://api.chat.nexusnerds.com.br/chat/ultima-lida`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: meuID,
          conversaId: idAtual,
          timestamp: ultimaMensagem.timestamp,
        }),
      });
  
      socket.emit('visualizar_conversa', { de: meuID, para: idAtual, isGroup: destinatario?.isGroup });
  
      setUnreadMessages((prev) => {
        const atualizadas = {
          ...prev,
          [idAtual]: 0,
        };
        localStorage.setItem('chat_unread', JSON.stringify(atualizadas));
        return atualizadas;
      });
    };
  
    if (destinatario) {
      const idAtual = destinatario?.isGroup ? destinatario.id : destinatario?.UnicID_User;
      const mensagens = conversas[idAtual] || [];
      if (mensagens.length > 0) {
        marcarComoLido();
      }
    }
  }, [conversas, destinatario, setUnreadMessages]);

  useEffect(() => {
    if (!meuID) {
      console.error('Erro: meuID não encontrado. Não registrando socket.');
      return;
    }

    socket.emit('registrar', meuID);

    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', meuID);
    }, 10000);

    socket.on('usuarios_online', (lista) => {
      setUsuariosDisponiveis((prev) =>
        prev.map((user) => ({
          ...user,
          online: lista.includes(user.id),
        }))
      );
    });

    socket.on('mensagem_privada', ({ mensagem, de, para, timestamp, replyTo, isGroup, unread }) => {
      const idOutro = de === meuID ? para : de;
      if (!idOutro) return;
    
      if (de === meuID) return;
    
      let mensagemFormatada;
      try {
        mensagemFormatada = JSON.parse(mensagem);
      } catch (e) {
        mensagemFormatada = { tipo: 'texto', texto: mensagem };
      }
    
      setConversas((prev) => {
        const conversaAtual = prev[idOutro] || [];
        const novasConversas = {
          ...prev,
          [idOutro]: [...conversaAtual, { ...mensagemFormatada, autor: de === meuID ? 'eu' : de, timestamp, replyTo, unread }],
        };
        localStorage.setItem('chat_conversas', JSON.stringify(novasConversas));
        return novasConversas;
      });
    
      if (de !== meuID) {
        notificationSound.play().catch((error) => {
          console.error('Erro ao tocar som de notificação:', error);
        });
        setUnreadMessages((prev) => {
          const atualizadas = {
            ...prev,
            [idOutro]: (prev[idOutro] || 0) + 1,
          };
          localStorage.setItem('chat_unread', JSON.stringify(atualizadas));
          return atualizadas;
        });
      }
    });

    socket.on('grupo_criado', ({ groupId, groupName, members }) => {
      if (members.includes(meuID)) {
        setUsuariosDisponiveis((prev) => [
          ...prev,
          {
            id: groupId,
            name: groupName,
            members,
            isGroup: true,
            timestamp: new Date().toISOString(),
          },
        ]);
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
      }
    });

    socket.on('digitando', ({ de, para, isGroup }) => {
      if (para === meuID || (isGroup && destinatario?.id === para && destinatario?.isGroup)) {
        setDigitandoUsuarios((prev) => ({
          ...prev,
          [de]: true,
        }));
      }
    });

    socket.on('parar_digitar', ({ de, para, isGroup }) => {
      if (para === meuID || (isGroup && destinatario?.id === para && destinatario?.isGroup)) {
        setDigitandoUsuarios((prev) => ({
          ...prev,
          [de]: false,
        }));
      }
    });

    socket.on('conversa_visualizada', ({ de, para }) => {
      if (para === meuID) {
        setMensagensVisualizadas((prev) => ({
          ...prev,
          [de]: true,
        }));
      }
    });

    socket.on('mensagem_deletada', ({ messageId, de, para, usuarioNome, isGroup }) => {
      const idOutro = de === meuID ? para : de;
      setConversas((prev) => {
        const conversaAtual = prev[idOutro] || [];
        const updatedConversa = conversaAtual.filter((msg, idx) => `${msg.timestamp}-${idx}` !== messageId);
        const mensagemSistema = {
          tipo: 'sistema',
          texto: `${usuarioNome} deletou a mensagem`,
          timestamp: new Date().toISOString(),
        };
        return {
          ...prev,
          [idOutro]: [...updatedConversa, mensagemSistema],
        };
      });
    });

    return () => {
      clearInterval(heartbeatInterval);
      socket.off('usuarios_online');
      socket.off('mensagem_privada');
      socket.off('grupo_criado');
      socket.off('digitando');
      socket.off('parar_digitar');
      socket.off('conversa_visualizada');
      socket.off('mensagem_deletada');
    };
  }, [meuID, destinatario, setUnreadMessages]);

  const enviarMensagem = () => {
    if (!mensagem.trim() || !destinatario) return;

    const timestampAgora = new Date().toISOString();
    const targetId = destinatario.isGroup ? destinatario.id : destinatario.UnicID_User;

    const mensagemObj = {
      tipo: 'texto',
      texto: mensagem,
      autor: 'eu',
      timestamp: timestampAgora,
      replyTo: replyingTo ? { messageId: replyingTo.messageId, texto: replyingTo.texto } : null,
    };

    setConversas((prev) => {
      const conversaAtual = prev[targetId] || [];
      return {
        ...prev,
        [targetId]: [...conversaAtual, mensagemObj],
      };
    });

    socket.emit('mensagem_privada', {
      para: targetId,
      mensagem: JSON.stringify({ tipo: 'texto', texto: mensagem }),
      de: meuID,
      timestamp: timestampAgora,
      replyTo: replyingTo ? { messageId: replyingTo.messageId, texto: replyingTo.texto } : null,
      isGroup: destinatario.isGroup,
    });

    setMensagem('');
    setReplyingTo(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !destinatario) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('O arquivo é muito grande. O limite é 10MB.');
      return;
    }

    const targetId = destinatario.isGroup ? destinatario.id : destinatario.UnicID_User;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      const timestampAgora = new Date().toISOString();
      const nomeSanitizado = file.name.replace(/\s+/g, '_');

      const caminho = `${meuID}_${targetId}/${nomeSanitizado}`;

      const mensagemObj = {
        tipo: 'anexo',
        nomeArquivo: nomeSanitizado,
        mimeType: file.type,
        url: `/anexos/${caminho}`,
        autor: 'eu',
        timestamp: timestampAgora,
        replyTo: replyingTo ? { messageId: replyingTo.messageId, texto: replyingTo.texto } : null,
      };

      setConversas((prev) => {
        const conversaAtual = prev[targetId] || [];
        return {
          ...prev,
          [targetId]: [...conversaAtual, mensagemObj],
        };
      });

      socket.emit('enviar_anexo', {
        para: targetId,
        de: meuID,
        nomeArquivo: nomeSanitizado,
        tipo: file.type,
        dadosBase64: base64Data,
        timestamp: timestampAgora,
        replyTo: replyingTo ? { messageId: replyingTo.messageId, texto: replyingTo.texto } : null,
        isGroup: destinatario.isGroup,
      });
    };

    reader.readAsDataURL(file);
    e.target.value = null;
    setReplyingTo(null);
  };

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversas[destinatario?.isGroup ? destinatario.id : destinatario?.UnicID_User]]);

  return (
    <Box display="flex" flexDir="column" h="100%" position="relative">
      {/* Cabeçalho fixo */}
      <Box
        bg="green.600"
        px={3}
        py={2}
        position="sticky"
        top="0"
        zIndex="10"
        borderTopRadius="xl"
      >
        {!destinatario ? (
          <Flex align="center" justify="space-between" position="relative">
            <Text color="white" fontSize="lg" fontWeight="bold">
              Chat Integrado
            </Text>
            <IconButton
              icon={<FiX />}
              onClick={onClose}
              colorScheme="whiteAlpha"
              variant="ghost"
              aria-label="Fechar chat"
            />
          </Flex>
        ) : (
          <Flex direction="column">
            <Flex align="center">
              <IconButton
                icon={<FiArrowLeft />}
                onClick={() => setDestinatario(null)}
                colorScheme="whiteAlpha"
                variant="ghost"
                aria-label="Voltar"
              />
              <HStack spacing={3} flex="1" ml={2}>
                <Box
                  boxSize="35px"
                  borderRadius="full"
                  bg="whiteAlpha.400"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  overflow="hidden"
                >
                  {destinatario?.pic_profile_link ? (
                    <img
                      src={destinatario.pic_profile_link}
                      alt="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Text fontWeight="bold" color="white">
                      {destinatario?.name?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </Box>
                <VStack align="start" spacing={0}>
                  <Text color="white" fontWeight="bold" fontSize="md" isTruncated>
                    {destinatario?.name || 'Contato'}
                  </Text>
                  {digitandoUsuarios?.[destinatario.id || destinatario.UnicID_User] && (
                    <Text fontSize="xs" color="whiteAlpha.800">
                      digitando...
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Flex>
          </Flex>
        )}
      </Box>

      {/* Corpo do chat */}
      {!destinatario ? (
        <SidebarFlutuante
          usuariosDisponiveis={usuariosDisponiveis}
          destinatario={destinatario}
          setDestinatario={setDestinatario}
          buscarHistoricoConversa={buscarHistoricoConversa}
          socket={socket}
          meuID={meuID}
          unreadMessages={unreadMessages}
          setUnreadMessages={setUnreadMessages}
          conversas={conversas}
        />
      ) : (
        <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
          <Box flex="1" overflowY="auto" px={3}>
            <MessagesFlutuante
              lista={conversas[destinatario.isGroup ? destinatario.id : destinatario?.UnicID_User] || []}
              destinatario={destinatario}
              replyingTo={replyingTo}
              handleReply={setReplyingTo}
              mensagensEndRef={mensagensEndRef}
              formatarSeparadorDia={formatarSeparadorDia}
              formatarHora={formatarHora}
              ultimaMensagemLidaTimestamp={ultimaMensagemLidaTimestamp}
            />
          </Box>
          <Box px={3} pt={2}>
            <MessageInputFlutuante
              mensagem={mensagem}
              setMensagem={setMensagem}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              enviarMensagem={enviarMensagem}
              handleFileChange={handleFileChange}
              debouncedEnviarDigitando={debounce(() => {
                if (!destinatario) return;

                socket.emit('digitando', {
                  de: meuID,
                  para: destinatario.isGroup ? destinatario.id : destinatario.UnicID_User,
                  isGroup: destinatario.isGroup,
                });

                setTimeout(() => {
                  socket.emit('parar_digitar', {
                    de: meuID,
                    para: destinatario.isGroup ? destinatario.id : destinatario.UnicID_User,
                    isGroup: destinatario.isGroup,
                  });
                }, 2500);
              }, 500)}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}