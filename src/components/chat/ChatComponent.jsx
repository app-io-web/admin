import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Flex, useColorModeValue } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import UserInfoPanel from './UserInfoPanel';
import { socket, BASE_NOCODB, TOKEN_NOCODB, debounce, formatarSeparadorDia, formatarHora } from './utils.jsx';

export default function ChatComponent() {
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const meuID = usuario?.idUnico;

  console.log('Usuario do localStorage:', usuario);

  const [mensagem, setMensagem] = useState('');
  const [conversas, setConversas] = useState({});
  const [usuariosSistema, setUsuariosSistema] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [usuariosOnline, setUsuariosOnline] = useState([]);
  const [destinatario, setDestinatario] = useState(null);
  const [mensagensVisualizadas, setMensagensVisualizadas] = useState({});
  const [digitandoUsuarios, setDigitandoUsuarios] = useState({});
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('midias');
  const [replyingTo, setReplyingTo] = useState(null);
  const [visibleMessagesCount, setVisibleMessagesCount] = useState(20);
  const [unreadMessages, setUnreadMessages] = useState({});
  const mensagensEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const meuNome = useMemo(() => {
    const usuarioSistema = usuariosSistema.find(user => user.UnicID_User === meuID);
    const nomeLocalStorage = usuario.name;
    const nomeFinal = nomeLocalStorage || usuarioSistema?.name || 'Usuario Desconhecido';
    console.log(`Meu nome resolvido: ${nomeFinal} (localStorage: ${nomeLocalStorage}, usuariosSistema: ${usuarioSistema?.name})`);
    return nomeFinal;
  }, [usuario, usuariosSistema, meuID]);

  const enviarDigitando = useCallback(() => {
    if (destinatario) {
      const startTime = performance.now();
      const targetId = destinatario.isGroup ? destinatario.id : destinatario.UnicID_User;
      socket.emit('digitando', { de: meuID, para: targetId, isGroup: destinatario.isGroup }, () => {
        const endTime = performance.now();
        console.log(`Tempo para enviar 'digitando': ${endTime - startTime}ms`);
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('parar_digitar', { de: meuID, para: targetId, isGroup: destinatario.isGroup });
      }, 900);
    }
  }, [destinatario, meuID]);

  const debouncedEnviarDigitando = useMemo(() => debounce(enviarDigitando, 900), [enviarDigitando]);

  const deletarMensagem = (messageId, destinatarioId) => {
    console.log(`Deletando mensagem. messageId: ${messageId}, destinatarioId: ${destinatarioId}, usuarioNome: ${meuNome}`);
    
    setConversas((prev) => {
      const conversaAtual = prev[destinatarioId] || [];
      const updatedConversa = conversaAtual.filter((msg, idx) => `${msg.timestamp}-${idx}` !== messageId);
      return {
        ...prev,
        [destinatarioId]: updatedConversa,
      };
    });

    const mensagemSistema = {
      tipo: 'sistema',
      texto: `${meuNome} deletou a mensagem`,
      timestamp: new Date().toISOString(),
    };

    setConversas((prev) => {
      const conversaAtual = prev[destinatarioId] || [];
      return {
        ...prev,
        [destinatarioId]: [...conversaAtual, mensagemSistema],
      };
    });

    socket.emit('deletar_mensagem', {
      messageId,
      de: meuID,
      para: destinatarioId,
      usuarioNome: meuNome,
      isGroup: destinatario.isGroup,
    });
  };

  const loadMoreMessages = () => {
    setVisibleMessagesCount((prev) => prev + 20);
  };

  const buscarHistoricoConversa = async (meuID, idOutroUsuario, isGroup = false) => {
    if (isGroup) {
      try {
        const res = await fetch(`http://localhost:4007/group/${idOutroUsuario}`);
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
          [idOutroUsuario]: historicoFormatado,
        }));
      } catch (error) {
        console.error('Erro ao buscar historico do grupo:', error);
      }
    } else {
      const idsOrdenados = [meuID, idOutroUsuario].sort();
      try {
        const res = await fetch(`http://localhost:4007/chat/${idsOrdenados[0]}/${idsOrdenados[1]}`);
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
          [idOutroUsuario]: historicoFormatado,
        }));
      } catch (error) {
        console.error('Erro ao buscar historico:', error);
      }
    }
  };

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
      alert('O arquivo e muito grande. O limite e 10MB.');
      return;
    }

    const targetId = destinatario.isGroup ? destinatario.id : destinatario.UnicID_User;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      const timestampAgora = new Date().toISOString();

      const mensagemObj = {
        tipo: 'anexo',
        nomeArquivo: file.name,
        mimeType: file.type,
        url: `/anexos/${file.name}`,
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
        nomeArquivo: file.name,
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

  const handleAvatarClick = (user) => {
    setSelectedUser(user);
    setShowUserInfo(true);
  };

  const closeUserInfo = () => {
    setShowUserInfo(false);
    setSelectedUser(null);
    setActiveTab('midias');
  };

  const handleReply = (msg, index) => {
    setReplyingTo({
      messageId: `${msg.timestamp}-${index}`,
      texto: msg.tipo === 'texto' ? msg.texto : msg.nomeArquivo,
    });
  };

  useEffect(() => {
    if (!meuID) {
      console.error('Erro: meuID nao encontrado. Nao registrando socket.');
      return;
    }

    socket.emit('registrar', meuID);

    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', meuID);
    }, 10000);

    socket.on('usuarios_online', (lista) => {
      setUsuariosOnline(lista);
    });

    socket.on('grupo_criado', ({ groupId, groupName, members }) => {
      if (members.includes(meuID)) {
        setGrupos((prev) => {
          const grupoExistente = prev.find(grupo => grupo.id === groupId);
          if (grupoExistente) return prev;
          return [
            ...prev,
            {
              id: groupId,
              name: groupName,
              members,
              isGroup: true,
              timestamp: new Date().toISOString(),
            },
          ];
        });
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
        return {
          ...prev,
          [idOutro]: [
            ...conversaAtual,
            { ...mensagemFormatada, autor: de === meuID ? 'eu' : de, timestamp, replyTo, unread },
          ],
        };
      });

      const currentDestinatarioId = destinatario?.isGroup ? destinatario.id : destinatario?.UnicID_User;
      if (currentDestinatarioId !== idOutro && unread) {
        setUnreadMessages((prev) => ({
          ...prev,
          [idOutro]: (prev[idOutro] || 0) + 1,
        }));
        console.log('Tentando tocar som de notificacao...');
        const audio = new Audio();
        audio.src = '/notification.mp3';
        audio.onerror = () => {
          console.error('Falha ao carregar MP3, tentando OGG...');
          audio.src = '/notification.ogg';
        };
        audio.play().catch((err) => console.error('Erro ao tocar som:', err));
      }

      if (currentDestinatarioId === idOutro) {
        socket.emit('visualizar_conversa', { de: meuID, para: idOutro, isGroup });
        setUnreadMessages((prev) => ({
          ...prev,
          [idOutro]: 0,
        }));
      }
    });

    socket.on('digitando', ({ de, para, isGroup }) => {
      const startTime = performance.now();
      if (para === meuID || (isGroup && destinatario?.id === para && destinatario?.isGroup)) {
        setDigitandoUsuarios((prev) => {
          const endTime = performance.now();
          console.log(`Tempo para processar 'digitando': ${endTime - startTime}ms`);
          return {
            ...prev,
            [de]: true,
          };
        });
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
        setUnreadMessages((prev) => ({
          ...prev,
          [de]: 0,
        }));
      }
    });

    socket.on('mensagem_deletada', ({ messageId, de, para, usuarioNome, isGroup }) => {
      const idOutro = de === meuID ? para : de;
      console.log(`Mensagem deletada recebida. Nome do usuario: ${usuarioNome}`); // Emoji removido
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
      socket.off('grupo_criado');
      socket.off('mensagem_privada');
      socket.off('digitando');
      socket.off('parar_digitar');
      socket.off('conversa_visualizada');
      socket.off('mensagem_deletada');
    };
  }, [meuID, destinatario]);

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversas[destinatario?.isGroup ? destinatario.id : destinatario?.UnicID_User]]);

  useEffect(() => {
    const buscarUsuariosSistema = async () => {
      try {
        const res = await fetch(`${BASE_NOCODB}/api/v2/tables/mn8xn7q4lsvk963/records`, {
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
            'xc-token': TOKEN_NOCODB,
          },
        });
        const data = await res.json();
        setUsuariosSistema(data?.list || []);
      } catch (err) {
        console.error('Erro ao buscar usuarios do sistema:', err);
      }
    };

    const buscarGrupos = async () => {
      if (!meuID) return;
      try {
        const res = await fetch(`http://localhost:4007/groups/${meuID}`);
        const data = await res.json();
        setGrupos(data.map((grupo) => ({
          id: grupo.id,
          name: grupo.name,
          members: grupo.members,
          isGroup: true,
          timestamp: grupo.createdAt,
        })));
      } catch (err) {
        console.error('Erro ao buscar grupos:', err);
      }
    };

    buscarUsuariosSistema();
    buscarGrupos();
  }, [meuID]);

  const usuariosDisponiveis = [
    ...usuariosSistema
      .filter((user) => user.UnicID_User !== meuID)
      .map((user) => ({
        ...user,
        online: usuariosOnline.includes(user.UnicID_User),
      })),
    ...grupos,
  ];

  return (
    <Flex
      minW="900px" // Largura mínima para suportar o ChatArea
      minH="700px"  // Altura mínima para suportar o ChatArea
      h="calc(100vh - 100px)"
      bg={useColorModeValue('gray.50', 'gray.800')}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="lg"
      m={4}
      transition="all 0.3s ease"
    >
      <Sidebar
        usuariosDisponiveis={usuariosDisponiveis}
        destinatario={destinatario}
        setDestinatario={setDestinatario}
        buscarHistoricoConversa={buscarHistoricoConversa}
        socket={socket}
        meuID={meuID}
        setVisibleMessagesCount={setVisibleMessagesCount}
        digitandoUsuarios={digitandoUsuarios}
        setConversas={setConversas}
        unreadMessages={unreadMessages}
        setUnreadMessages={setUnreadMessages}
      />
      <ChatArea
        destinatario={destinatario}
        conversas={conversas}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        handleReply={handleReply}
        mensagensEndRef={mensagensEndRef}
        mensagensVisualizadas={mensagensVisualizadas}
        showUserInfo={showUserInfo}
        deletarMensagem={deletarMensagem}
        visibleMessagesCount={visibleMessagesCount}
        loadMoreMessages={loadMoreMessages}
        mensagem={mensagem}
        setMensagem={setMensagem}
        enviarMensagem={enviarMensagem}
        handleFileChange={handleFileChange}
        debouncedEnviarDigitando={debouncedEnviarDigitando}
        handleAvatarClick={handleAvatarClick}
        formatarSeparadorDia={formatarSeparadorDia}
        formatarHora={formatarHora}
      />
      <UserInfoPanel
        selectedUser={selectedUser}
        showUserInfo={showUserInfo}
        closeUserInfo={closeUserInfo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conversas={conversas}
      />
    </Flex>
  );
}