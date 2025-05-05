import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Text,
  SimpleGrid,
  useToast,
  useDisclosure,
  Modal,
  VStack,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  useColorModeValue,
  Image,
  Select,
} from '@chakra-ui/react';
import { EditIcon, AddIcon, DeleteIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

export default function AtalhosPessoais() {
  const [atalhos, setAtalhos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [atalhoAtual, setAtalhoAtual] = useState({ nome: '', url: '', icone: '', email: '', senha: '' });
  const [registroId, setRegistroId] = useState(null);
  const [atalhoIndex, setAtalhoIndex] = useState(null);
  const [atalhoSelecionado, setAtalhoSelecionado] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [iconInputMethod, setIconInputMethod] = useState('url');

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario.idUnico;
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isInfoOpen, onOpen: onInfoOpen, onClose: onInfoCloseOriginal } = useDisclosure();

  const bgCard = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Função ajustada para fechar o modal de informações
  const onInfoClose = () => {
    setAtalhoSelecionado(null); // Reseta o atalho selecionado
    setShowPassword(false); // Reseta a visibilidade da senha
    onInfoCloseOriginal(); // Chama a função original de fechar o modal
  };

  const fetchAtalhos = async () => {
    setCarregando(true);
    try {
      const res = await fetch(`https://api.atalhos.nexusnerds.com.br/atalhos/${unicID_user}`);
      const data = await res.json();
      setAtalhos(data.Atalhos || []);
      setRegistroId(data.Id);
    } catch (err) {
      console.error('Erro ao buscar atalhos:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os atalhos.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
  };

  const salvarAtalho = async () => {
    try {
      const method = atalhoIndex !== null ? 'PATCH' : 'POST';
      const url = 'https://api.atalhos.nexusnerds.com.br/atalhos';
      const body = atalhoIndex !== null
        ? { unicID_user, Atalhos: atalhoAtual, Id: registroId, atalhoIndex }
        : { unicID_user, Atalhos: atalhoAtual };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      await res.json();
      toast({
        title: 'Sucesso',
        description: 'Atalho salvo com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchAtalhos();
      onClose();
      setAtalhoAtual({ nome: '', url: '', icone: '', email: '', senha: '' });
      setAtalhoIndex(null);
      setIconInputMethod('url');
    } catch (err) {
      console.error('Erro ao salvar atalho:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o atalho.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const deletarAtalho = async (index, e) => {
    e.stopPropagation();
    try {
      await fetch(`https://api.atalhos.nexusnerds.com.br/atalhos/${unicID_user}/${index}`, { method: 'DELETE' });
      toast({
        title: 'Sucesso',
        description: 'Atalho deletado com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchAtalhos();
    } catch (err) {
      console.error('Erro ao deletar atalho:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o atalho.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleOpenModal = (atalho = null, index = null, e) => {
    e.stopPropagation();
    if (atalho) {
      setAtalhoAtual(atalho);
      setAtalhoIndex(index);
      setIconInputMethod(atalho.icone && atalho.icone.startsWith('data:image') ? 'upload' : 'url');
    } else {
      setAtalhoAtual({ nome: '', url: '', icone: '', email: '', senha: '' });
      setAtalhoIndex(null);
      setIconInputMethod('url');
    }
    onOpen();
  };

  const isValidUrl = (url) => {
    if (!url) return false;
    try {
      const urlPattern = /^(https?:\/\/)/i;
      return urlPattern.test(url);
    } catch {
      return false;
    }
  };

  const handleRedirect = (atalho) => {
    if (atalho?.url && isValidUrl(atalho.url)) {
      window.open(atalho.url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: 'Erro',
        description: 'URL inválida ou não fornecida.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
    onInfoClose(); // Fecha o modal (se aberto) e reseta o estado
  };

  const handleOpenInfoModal = (atalho) => {
    setAtalhoSelecionado(atalho);
    setShowPassword(false);

    const hasEmail = atalho?.email && atalho.email.trim() !== '';
    const hasSenha = atalho?.senha && atalho.senha.trim() !== '';

    if (hasEmail && hasSenha) {
      onInfoOpen();
    } else {
      handleRedirect(atalho); // Passa o atalho diretamente para evitar dependência de estado
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erro',
          description: 'Por favor, selecione um arquivo de imagem.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        toast({
          title: 'Erro',
          description: 'O arquivo é muito grande. O tamanho máximo é 5MB.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAtalhoAtual({ ...atalhoAtual, icone: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchAtalhos();
  }, []);

  return (
    <Box p={{ base: 3, md: 4 }}>
      <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" mb={4} color={textColor}>
        Atalhos Pessoais
      </Text>

      {carregando ? (
        <Text>Carregando...</Text>
      ) : (
        <SimpleGrid columns={{ base: 3, md: 4 }} spacing={{ base: 3, md: 4 }}>
          {atalhos.map((atalho, index) => (
            <Box
              key={index}
              p={{ base: 3, md: 4 }}
              bg={bgCard}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="sm"
              cursor="pointer"
              onClick={() => handleOpenInfoModal(atalho)}
              _hover={{ boxShadow: 'md', transform: 'translateY(-2px)', transition: 'all 0.2s' }}
            >
              <VStack spacing={{ base: 1, md: 2 }} align="center">
                {atalho.icone && (
                  <Image
                    src={atalho.icone}
                    boxSize={{ base: '80px', md: '150px' }}
                    borderRadius="md"
                    objectFit="cover"
                  />
                )}
                <Text
                  fontWeight="bold"
                  color={textColor}
                  textAlign="center"
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  {atalho.nome}
                </Text>
              </VStack>
              <HStack spacing={2} mt={{ base: 2, md: 4 }} justifyContent="flex-end">
                <IconButton
                  icon={<EditIcon />}
                  size={{ base: 'xs', md: 'sm' }}
                  onClick={(e) => handleOpenModal(atalho, index, e)}
                  aria-label="Editar atalho"
                />
                <IconButton
                  icon={<DeleteIcon />}
                  size={{ base: 'xs', md: 'sm' }}
                  colorScheme="red"
                  onClick={(e) => deletarAtalho(index, e)}
                  aria-label="Deletar atalho"
                />
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <Button
        mt={{ base: 4, md: 6 }}
        colorScheme="blue"
        leftIcon={<AddIcon />}
        onClick={(e) => handleOpenModal(null, null, e)}
        size={{ base: 'md', md: 'md' }}
      >
        Adicionar Atalho
      </Button>

      {/* Modal de criação/edição */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{atalhoIndex !== null ? 'Editar Atalho' : 'Adicionar Atalho'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <FormControl>
                <FormLabel>Nome</FormLabel>
                <Input
                  value={atalhoAtual.nome}
                  onChange={(e) => setAtalhoAtual({ ...atalhoAtual, nome: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>URL</FormLabel>
                <Input
                  value={atalhoAtual.url}
                  onChange={(e) => setAtalhoAtual({ ...atalhoAtual, url: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Ícone</FormLabel>
                <Select
                  value={iconInputMethod}
                  onChange={(e) => {
                    setIconInputMethod(e.target.value);
                    setAtalhoAtual({ ...atalhoAtual, icone: '' });
                  }}
                  mb={2}
                >
                  <option value="url">Inserir URL</option>
                  <option value="upload">Fazer upload de imagem</option>
                </Select>
                {iconInputMethod === 'url' ? (
                  <Input
                    value={atalhoAtual.icone}
                    onChange={(e) => setAtalhoAtual({ ...atalhoAtual, icone: e.target.value })}
                    placeholder="https://example.com/image.png"
                  />
                ) : (
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    p={1}
                  />
                )}
                {atalhoAtual.icone && (
                  <Image src={atalhoAtual.icone} boxSize="100px" mt={2} borderRadius="md" objectFit="cover" />
                )}
              </FormControl>
              <FormControl>
                <FormLabel>Email (opcional)</FormLabel>
                <Input
                  value={atalhoAtual.email}
                  onChange={(e) => setAtalhoAtual({ ...atalhoAtual, email: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Senha (opcional)</FormLabel>
                <Input
                  value={atalhoAtual.senha}
                  onChange={(e) => setAtalhoAtual({ ...atalhoAtual, senha: e.target.value })}
                  type="password"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={salvarAtalho}>
              Salvar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de informações (email e senha) */}
      <Modal isOpen={isInfoOpen} onClose={onInfoClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Informações do Atalho</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  value={atalhoSelecionado?.email || 'Nenhum email fornecido'}
                  isReadOnly
                  variant="filled"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Senha</FormLabel>
                <HStack>
                  <Input
                    value={atalhoSelecionado?.senha || 'Nenhuma senha fornecida'}
                    isReadOnly
                    variant="filled"
                    type={showPassword ? 'text' : 'password'}
                  />
                  {atalhoSelecionado?.senha && (
                    <IconButton
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={toggleShowPassword}
                      aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                      variant="ghost"
                    />
                  )}
                </HStack>
              </FormControl>
              {!isValidUrl(atalhoSelecionado?.url) && (
                <Text color="red.500" fontSize="sm">
                  URL inválida. Por favor, forneça uma URL válida começando com http:// ou https://.
                </Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => handleRedirect(atalhoSelecionado)}
              isDisabled={!isValidUrl(atalhoSelecionado?.url)}
            >
              Ir para o site
            </Button>
            <Button variant="ghost" onClick={onInfoClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}