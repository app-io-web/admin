import { Box, Flex, Avatar, Text, VStack, Button, HStack, IconButton, useColorModeValue } from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';
import { formatarMes } from './utils';

const UserInfoPanel = ({ selectedUser, showUserInfo, closeUserInfo, activeTab, setActiveTab, conversas, ...rest }) => {
  const bgSidebar = useColorModeValue('white', 'gray.900');

  const getAnexosPorTipoEMes = () => {
    const conversa = conversas[selectedUser?.UnicID_User] || [];
    const midias = {};
    const documentos = {};
    const links = {};

    conversa.forEach((msg) => {
      if (!msg.timestamp) return;
      const mes = formatarMes(msg.timestamp).toUpperCase();

      if (msg.tipo === 'anexo') {
        if (msg.mimeType.startsWith('image/') || msg.mimeType.startsWith('video/')) {
          if (!midias[mes]) midias[mes] = [];
          midias[mes].push(msg);
        } else if (
          msg.mimeType === 'application/pdf' ||
          msg.mimeType === 'application/msword' ||
          msg.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          if (!documentos[mes]) documentos[mes] = [];
          documentos[mes].push(msg);
        }
      } else if (msg.tipo === 'texto' && msg.texto.match(/https?:\/\/[^\s]+/)) {
        if (!links[mes]) links[mes] = [];
        links[mes].push(msg);
      }
    });

    return { midias, documentos, links };
  };

  const renderConteudoAba = () => {
    const { midias, documentos, links } = getAnexosPorTipoEMes();
    const conteudo = activeTab === 'midias' ? midias : activeTab === 'documentos' ? documentos : links;

    if (Object.keys(conteudo).length === 0) {
      return <Text fontSize="sm" color="gray.500">Nenhum item compartilhado</Text>;
    }

    return (
      <VStack align="stretch" spacing={4}>
        {Object.keys(conteudo)
          .sort((a, b) => new Date(b) - new Date(a))
          .map((mes) => (
            <Box key={mes}>
              <Text fontWeight="bold" mb={2}>{mes}</Text>
              {activeTab === 'midias' && (
                <Flex wrap="wrap" gap={2}>
                  {conteudo[mes].map((msg, index) => (
                    <Box key={`midia-${mes}-${index}`} w="60px" h="60px">
                      {msg.mimeType.startsWith('image/') ? (
                        <img
                          src={`https://api.chat.nexusnerds.com.br${msg.url}`}
                          alt={msg.nomeArquivo}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <video
                          controls
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                        >
                          <source src={`https://api.chat.nexusnerds.com.br${msg.url}`} type={msg.mimeType} />
                          Seu navegador não suporta o elemento de vídeo.
                        </video>
                      )}
                    </Box>
                  ))}
                </Flex>
              )}
              {(activeTab === 'documentos' || activeTab === 'links') && (
                <VStack align="stretch" spacing={2}>
                  {conteudo[mes].map((msg, index) => (
                    <a
                      key={`${activeTab}-${mes}-${index}`}
                      href={
                        activeTab === 'documentos'
                          ? `https://api.chat.nexusnerds.com.br${msg.url}`
                          : msg.texto.match(/https?:\/\/[^\s]+/)[0]
                      }
                      download={activeTab === 'documentos' ? msg.nomeArquivo : undefined}
                      target={activeTab === 'links' ? '_blank' : undefined}
                      rel={activeTab === 'links' ? 'noopener noreferrer' : undefined}
                      style={{ color: 'blue', textDecoration: 'underline', fontSize: 'sm' }}
                    >
                      {activeTab === 'documentos'
                        ? msg.nomeArquivo
                        : msg.texto.match(/https?:\/\/[^\s]+/)[0]}
                    </a>
                  ))}
                </VStack>
              )}
            </Box>
          ))}
      </VStack>
    );
  };

  if (!showUserInfo || !selectedUser) return null;

  return (
    <Box
      w={{ base: '100%', md: '300px' }} // Largura total no mobile, 300px no desktop
      h="100%"
      bg={bgSidebar}
      p={4}
      borderLeftWidth={{ base: 0, md: '1px' }} // Sem borda no mobile
      borderColor="gray.200"
      overflowY="auto"
      boxShadow={{ base: 'lg', md: 'md' }} // Sombra maior no mobile para parecer um modal
      transition="width 0.3s ease"
      {...rest} // Aplica as props de display, position, etc.
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontWeight="bold" fontSize="xl">Informacoes do Usuario</Text>
        <IconButton
          icon={<FiX />}
          size="sm"
          onClick={closeUserInfo}
          aria-label="Fechar"
        />
      </Flex>
      <VStack align="stretch" spacing={4}>
        <Flex align="center">
          <Avatar size="lg" src={selectedUser.pic_profile_link} mr={3} />
          <Box>
            <Text fontWeight="bold">{selectedUser.name || 'Usuario Desconhecido'}</Text>
            <Text fontSize="sm" color="gray.500">
              {selectedUser.online ? 'Online' : 'Offline'}
            </Text>
            <Text fontSize="sm" color="gray.500">{selectedUser.user_login || 'Sem login'}</Text>
          </Box>
        </Flex>
        <Box>
          <Text fontWeight="bold" mb={2}>Acoes</Text>
          <VStack align="stretch" spacing={2}>
            <Button size="sm" colorScheme="blue" variant="outline">Enviar Mensagem</Button>
            <Button size="sm" colorScheme="gray" variant="outline">Ver Perfil</Button>
          </VStack>
        </Box>
        <Box>
          <Text fontWeight="bold" mb={2}>Detalhes</Text>
          <Text fontSize="sm">ID Unico: {selectedUser.UnicID_User}</Text>
          <Text fontSize="sm">Ultima Atividade: {selectedUser.online ? 'Agora' : 'Desconhecida'}</Text>
        </Box>
        <Box>
          <HStack spacing={2} mb={4}>
            <Button
              size="sm"
              variant={activeTab === 'midias' ? 'solid' : 'outline'}
              colorScheme={activeTab === 'midias' ? 'blue' : 'gray'}
              onClick={() => setActiveTab('midias')}
            >
              Midias
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'links' ? 'solid' : 'outline'}
              colorScheme={activeTab === 'links' ? 'blue' : 'gray'}
              onClick={() => setActiveTab('links')}
            >
              Links
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'documentos' ? 'solid' : 'outline'}
              colorScheme={activeTab === 'documentos' ? 'blue' : 'gray'}
              onClick={() => setActiveTab('documentos')}
            >
              Documentos
            </Button>
          </HStack>
          {renderConteudoAba()}
        </Box>
      </VStack>
    </Box>
  );
};

export default UserInfoPanel;