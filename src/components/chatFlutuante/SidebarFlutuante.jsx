// src/components/chatFlutuante/SidebarFlutuante.jsx
import { VStack, Text, Box, Input, useColorModeValue } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import UserItem from './UserItem';

export default function SidebarFlutuante({
  usuariosDisponiveis = [],
  destinatario,
  setDestinatario,
  buscarHistoricoConversa,
  meuID,
  conversas = {},
  setUnreadMessages,
  unreadMessages = {},
}) {
  const [search, setSearch] = useState('');
  const [filtrados, setFiltrados] = useState([]);

  // Carregar unreadMessages do localStorage no primeiro carregamento
  useEffect(() => {
    const unreadSalvas = localStorage.getItem('chat_unread');
    if (unreadSalvas) {
      setUnreadMessages(JSON.parse(unreadSalvas));
    }
  }, [setUnreadMessages]);

  // Salvar unreadMessages no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('chat_unread', JSON.stringify(unreadMessages));
  }, [unreadMessages]);

  // Calcular mensagens não lidas para todos os usuários ao carregar
  useEffect(() => {
    const fetchContadores = async () => {
      const novosContadores = {};
      for (const usuario of usuariosDisponiveis) {
        const userId = usuario.UnicID_User || usuario.id;
        const idsOrdenados = [meuID, userId].sort();
        try {
          const res = await fetch(`https://api.chat.nexusnerds.com.br/chat/${idsOrdenados[0]}/${idsOrdenados[1]}`);
          const data = await res.json();
          const historico = (data || []).map((msg) => ({
            ...msg,
            autor: msg.autor === meuID ? 'eu' : msg.autor,
            timestamp: msg.timestamp,
          }));

          const ultimaLidaRes = await fetch(`https://api.chat.nexusnerds.com.br/chat/ultima-lida/${meuID}/${userId}`);
          const ultimaLidaData = await ultimaLidaRes.json();
          const ultimaMensagemLida = ultimaLidaData.timestamp || '0000-01-01T00:00:00.000Z';

          const mensagensNaoLidas = historico.filter(
            (msg) => new Date(msg.timestamp) > new Date(ultimaMensagemLida) && msg.autor !== 'eu'
          ).length;

          novosContadores[userId] = mensagensNaoLidas;
        } catch (error) {
          console.error(`Erro ao buscar contador para ${userId}:`, error);
          novosContadores[userId] = 0;
        }
      }

      setUnreadMessages((prev) => {
        const atualizadas = { ...prev, ...novosContadores };
        localStorage.setItem('chat_unread', JSON.stringify(atualizadas));
        return atualizadas;
      });
    };

    if (usuariosDisponiveis.length > 0 && meuID) {
      fetchContadores();
    }
  }, [usuariosDisponiveis, meuID, setUnreadMessages]);

  useEffect(() => {
    const usuariosFiltrados = usuariosDisponiveis
      .filter((usuario) => {
        const nome = usuario.name || '';
        return nome.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        const idA = a.UnicID_User || a.id;
        const idB = b.UnicID_User || b.id;
  
        const mensagensA = conversas[idA] || [];
        const mensagensB = conversas[idB] || [];
  
        const ultimaA = mensagensA.length > 0 ? mensagensA[mensagensA.length - 1].timestamp : '0000-01-01T00:00:00.000Z';
        const ultimaB = mensagensB.length > 0 ? mensagensB[mensagensB.length - 1].timestamp : '0000-01-01T00:00:00.000Z';
  
        // Adicionar log para depuração
        //console.log(`Ordenando: ${a.name} (ultimaA: ${ultimaA}) vs ${b.name} (ultimaB: ${ultimaB})`);
        return new Date(ultimaB) - new Date(ultimaA); // Ordem decrescente (mais recente no topo)
      });
  
    setFiltrados(usuariosFiltrados);
  }, [usuariosDisponiveis, search, conversas]);

  return (
    <Box
      w="100%"
      maxH="300px"
      overflowY="auto"
      borderBottom="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      p={3}
      bg={useColorModeValue('white', 'gray.800')}
    >
      <Input
        placeholder="Buscar usuário"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        mb={3}
        bg={useColorModeValue('gray.100', 'gray.700')}
        borderColor={useColorModeValue('gray.300', 'gray.600')}
      />

      <VStack align="stretch" spacing={2}>
        {filtrados.length === 0 && <Text fontSize="sm">Nenhum usuário encontrado.</Text>}
        {filtrados.map((usuario) => {
          const isSelected = (destinatario?.UnicID_User || destinatario?.id) === (usuario.UnicID_User || usuario.id);
          const userId = usuario.UnicID_User || usuario.id;
          return (
            <UserItem
              key={userId}
              usuario={usuario}
              isSelected={isSelected}
              onClick={() => {
                setDestinatario(usuario);
                buscarHistoricoConversa(usuario);
              }}
              unreadCount={unreadMessages[userId] || 0}
            />
          );
        })}
      </VStack>
    </Box>
  );
}