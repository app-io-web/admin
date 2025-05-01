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
  Textarea,
  Spinner,
  useColorMode,
  useColorModeValue,
  Input,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Checkbox,
  Text as ChakraText,
  Image,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import { EditIcon, AddIcon, DeleteIcon, AttachmentIcon, ViewIcon } from '@chakra-ui/icons';

export default function NotasPessoais() {
  const [notas, setNotas] = useState({ Id: null, notas: [] });
  const [carregando, setCarregando] = useState(false);
  const [notaAtual, setNotaAtual] = useState({
    titulo: '',
    descricao: '',
    checklist: [],
    anexos: [],
  });
  const [notaId, setNotaId] = useState(null);
  const [notaIndex, setNotaIndex] = useState(null);
  const [novoItemChecklist, setNovoItemChecklist] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const notesPerPage = 6;

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario.idUnico || 'user_123';
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

  const { colorMode } = useColorMode();
  const bgCard = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const buttonBg = useColorModeValue('blue.500', 'blue.600');
  const buttonHoverBg = useColorModeValue('blue.600', 'blue.700');
  const buttonIconColor = useColorModeValue('blue.500', 'blue.400');

  const fetchNotas = async () => {
    setCarregando(true);
    try {
      const res = await fetch(`https://api.notas.nexusnerds.com.br/notas/${unicID_user}`);
      const data = await res.json();
      setNotas(data);
      setNotaId(data.Id);
    } catch (err) {
      console.error('Erro ao buscar notas:', err);
      toast({ title: 'Erro', description: 'Não foi possível carregar as notas.', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setCarregando(false);
    }
  };

  const handleAddChecklistItem = () => {
    if (novoItemChecklist.trim()) {
      setNotaAtual({
        ...notaAtual,
        checklist: [...notaAtual.checklist, { texto: novoItemChecklist, concluido: false }],
      });
      setNovoItemChecklist('');
    }
  };

  const handleRemoveChecklistItem = (index) => {
    setNotaAtual({
      ...notaAtual,
      checklist: notaAtual.checklist.filter((_, i) => i !== index),
    });
  };

  const handleToggleChecklistItem = (index) => {
    setNotaAtual({
      ...notaAtual,
      checklist: notaAtual.checklist.map((item, i) =>
        i === index ? { ...item, concluido: !item.concluido } : item
      ),
    });
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const novosAnexos = files.map((file) => ({
      file,
      url: null,
    }));
    setNotaAtual({
      ...notaAtual,
      anexos: [...notaAtual.anexos, ...novosAnexos],
    });
  };

  const handleRemoveAnexo = (index) => {
    setNotaAtual({
      ...notaAtual,
      anexos: notaAtual.anexos.filter((_, i) => i !== index),
    });
  };

  const uploadFileToNocoDB = async (file) => {
    try {
      const nomeArquivoSemEspacos = file.name.replace(/\s+/g, '_');
      const anexoCorrigido = new File([file], nomeArquivoSemEspacos, { type: file.type });
      const formData = new FormData();
      const nomeArquivoCorrigido = encodeURIComponent(nomeArquivoSemEspacos);
      formData.append('file', anexoCorrigido);
      formData.append('size', anexoCorrigido.size);
      formData.append('title', nomeArquivoCorrigido);
      formData.append('path', `/${Date.now()}_${nomeArquivoCorrigido}`);

      const res = await fetch('https://nocodb.nexusnerds.com.br/api/v2/storage/upload', {
        method: 'POST',
        headers: { 'xc-token': 'PQFnWUYFjMfX7aAVow3zO11oNhyvQugsPoYWDVw6' },
        body: formData,
      });

      const result = await res.json();
      const path = result?.[0]?.path;
      if (!path) throw new Error('URL não retornada corretamente');
      return `https://nocodb.nexusnerds.com.br/${path}`;
    } catch (err) {
      console.error('Erro no upload:', err);
      throw err;
    }
  };

  const salvarNota = async () => {
    try {
      const anexosComUrls = await Promise.all(
        notaAtual.anexos.map(async (anexo) => {
          if (anexo.url) {
            return { url: anexo.url };
          }
          const url = await uploadFileToNocoDB(anexo.file);
          return { url };
        })
      );

      const notaEditada = {
        id: notaIndex !== null ? notas.notas[notaIndex]?.id : Date.now(),
        titulo: notaAtual.titulo || "Nova Nota",
        status: "pending",
        feito: false,
        descricao: notaAtual.descricao || "Sem descrição",
        anexos: anexosComUrls,
        comentarios: notaIndex !== null ? notas.notas[notaIndex]?.comentarios || [] : [],
        checklist: notaAtual.checklist,
        createdAt: notaIndex !== null ? notas.notas[notaIndex]?.createdAt : new Date().toISOString(), // Adiciona createdAt
      };

      let res;
      if (notaIndex !== null) {
        res = await fetch('https://api.notas.nexusnerds.com.br/notas', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unicID_user, notas: notaEditada, Id: notaId, notaIndex }),
        });
      } else {
        res = await fetch('https://api.notas.nexusnerds.com.br/notas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unicID_user, notas: notaEditada }),
        });
      }

      await res.json();
      toast({
        title: 'Sucesso',
        description: notaIndex !== null ? 'Nota atualizada com sucesso!' : 'Nota salva com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchNotas();
      onClose();
      setNotaIndex(null);
      setNotaAtual({ titulo: '', descricao: '', checklist: [], anexos: [] });
      setCurrentPage(1);
    } catch (err) {
      console.error('Erro ao salvar nota:', err);
      toast({ title: 'Erro', description: 'Não foi possível salvar a nota.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const deletarNota = async (index) => {
    try {
      const res = await fetch(`https://api.notas.nexusnerds.com.br/notas/${unicID_user}/${index}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      await res.json();
      toast({
        title: 'Sucesso',
        description: 'Nota deletada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchNotas();
      const totalPages = Math.ceil(notas.notas.length / notesPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
    } catch (err) {
      console.error('Erro ao deletar nota:', err);
      toast({ title: 'Erro', description: 'Não foi possível deletar a nota.', status: 'error', duration: 4000, isClosable: true });
    }
  };

  const handleOpenModal = (nota = null, index = null) => {
    if (nota) {
      setNotaAtual({
        titulo: nota.titulo || '',
        descricao: nota.descricao || '',
        checklist: nota.checklist || [],
        anexos: nota.anexos?.map((anexo) => ({
          url: anexo.url || null,
          file: null,
        })) || [],
      });
      setNotaIndex(index);
    } else {
      setNotaAtual({ titulo: '', descricao: '', checklist: [], anexos: [] });
      setNotaIndex(null);
    }
    onOpen();
  };

  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  };

  const handlePreviewImage = (url) => {
    setPreviewImageUrl(url);
    onPreviewOpen();
  };

  // Função para verificar se a nota é "nova" (menos de 24 horas)
  const isNewNote = (createdAt) => {
    if (!createdAt) return false;
    const now = new Date();
    const noteDate = new Date(createdAt);
    const diffInHours = (now - noteDate) / (1000 * 60 * 60); // Diferença em horas
    return diffInHours < 24; // Considera "nova" se tiver menos de 24 horas
  };

  useEffect(() => {
    fetchNotas();
  }, []);

  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = notas.notas?.slice(indexOfFirstNote, indexOfLastNote) || [];
  const totalPages = Math.ceil((notas.notas?.length || 0) / notesPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Box p={4}>
      <Text fontSize="2xl" fontWeight="bold" mb={6} color={textColor}>
        Notas Pessoais
      </Text>

      {carregando ? (
        <Spinner color={buttonBg} />
      ) : (
        <>
          {notas.notas && notas.notas.length > 0 ? (
            <>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                {currentNotes.map((nota, index) => (
                  <Box
                    key={indexOfFirstNote + index}
                    p={6}
                    bg={bgCard}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={borderColor}
                    boxShadow="sm"
                    transition="all 0.2s"
                    _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    minHeight="150px"
                  >
                    <Box>
                      <HStack spacing={2} mb={2}>
                        <Text
                          whiteSpace="pre-wrap"
                          color={textColor}
                          fontWeight="bold"
                        >
                          {nota.titulo || 'Sem título'}
                        </Text>
                        {isNewNote(nota.createdAt) && (
                          <Tag size="sm" colorScheme="green" borderRadius="full">
                            <TagLabel>Nova Nota</TagLabel>
                          </Tag>
                        )}
                      </HStack>
                      <Text
                        whiteSpace="pre-wrap"
                        color={textColor}
                        flex="1"
                        mb={4}
                      >
                        {nota.descricao || 'Sem descrição'}
                      </Text>
                    </Box>
                    <HStack justifyContent="flex-end">
                      <Button
                        size="xs"
                        variant="ghost"
                        color={buttonIconColor}
                        _hover={{ color: buttonHoverBg }}
                        onClick={() => handleOpenModal(nota, indexOfFirstNote + index)}
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="red.500"
                        _hover={{ color: 'red.600' }}
                        onClick={() => deletarNota(indexOfFirstNote + index)}
                      >
                        <DeleteIcon />
                      </Button>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>

              {totalPages > 1 && (
                <HStack mt={6} justifyContent="center" spacing={4}>
                  <Button
                    onClick={handlePreviousPage}
                    isDisabled={currentPage === 1}
                    bg={buttonBg}
                    color="white"
                    _hover={{ bg: buttonHoverBg }}
                  >
                    Anterior
                  </Button>
                  <Text color={textColor}>
                    Página {currentPage} de {totalPages}
                  </Text>
                  <Button
                    onClick={handleNextPage}
                    isDisabled={currentPage === totalPages}
                    bg={buttonBg}
                    color="white"
                    _hover={{ bg: buttonHoverBg }}
                  >
                    Próximo
                  </Button>
                </HStack>
              )}
            </>
          ) : (
            <Text color={textColor}>Nenhuma nota encontrada.</Text>
          )}
        </>
      )}

      <Button
        mt={6}
        bgGradient="linear(to-r, blue.400, blue.600)"
        color="white"
        _hover={{ bgGradient: 'linear(to-r, blue.500, blue.700)' }}
        leftIcon={<AddIcon />}
        onClick={() => handleOpenModal()}
      >
        Criar Nova Nota
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent
          bg={bgCard}
          borderRadius="lg"
          boxShadow="lg"
        >
          <ModalHeader color={textColor}>{notaIndex !== null ? 'Editar Nota' : 'Criar Nota'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel color={textColor}>Título</FormLabel>
              <Input
                value={notaAtual.titulo}
                onChange={(e) => setNotaAtual({ ...notaAtual, titulo: e.target.value })}
                placeholder="Digite o título da nota..."
                borderColor={borderColor}
                focusBorderColor={buttonBg}
                bg={useColorModeValue('gray.50', 'gray.700')}
                color={textColor}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel color={textColor}>Descrição</FormLabel>
              <Textarea
                value={notaAtual.descricao}
                onChange={(e) => setNotaAtual({ ...notaAtual, descricao: e.target.value })}
                placeholder="Digite sua nota aqui..."
                rows={5}
                borderColor={borderColor}
                focusBorderColor={buttonBg}
                bg={useColorModeValue('gray.50', 'gray.700')}
                color={textColor}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel color={textColor}>Checklist</FormLabel>
              <VStack align="stretch" spacing={2}>
                {notaAtual.checklist.map((item, index) => (
                  <HStack key={index} justify="space-between">
                    <Checkbox
                      isChecked={item.concluido}
                      onChange={() => handleToggleChecklistItem(index)}
                      colorScheme="blue"
                    >
                      <ChakraText color={textColor}>{item.texto}</ChakraText>
                    </Checkbox>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      color={buttonIconColor}
                      _hover={{ color: buttonHoverBg }}
                      icon={<DeleteIcon />}
                      onClick={() => handleRemoveChecklistItem(index)}
                    />
                  </HStack>
                ))}
                <HStack>
                  <Input
                    value={novoItemChecklist}
                    onChange={(e) => setNovoItemChecklist(e.target.value)}
                    placeholder="Novo item de checklist..."
                    borderColor={borderColor}
                    focusBorderColor={buttonBg}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    color={textColor}
                  />
                  <Button
                    size="sm"
                    bg={buttonBg}
                    color="white"
                    _hover={{ bg: buttonHoverBg }}
                    onClick={handleAddChecklistItem}
                  >
                    Adicionar
                  </Button>
                </HStack>
              </VStack>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel color={textColor}>Anexos</FormLabel>
              <VStack align="stretch" spacing={2}>
                {notaAtual.anexos.map((anexo, index) => (
                  <HStack key={index} justify="space-between">
                    <HStack spacing={2}>
                      <ChakraText color={textColor}>
                        {anexo.url ? (
                          <a href={anexo.url} target="_blank" rel="noopener noreferrer">
                            {anexo.url.split('/').pop()}
                          </a>
                        ) : anexo.file ? (
                          anexo.file.name
                        ) : (
                          'Arquivo inválido'
                        )}
                      </ChakraText>
                      {anexo.url && isImageFile(anexo.url) && (
                        <IconButton
                          size="sm"
                          variant="ghost"
                          color={buttonIconColor}
                          _hover={{ color: buttonHoverBg }}
                          icon={<ViewIcon />}
                          onClick={() => handlePreviewImage(anexo.url)}
                          aria-label="Visualizar imagem"
                        />
                      )}
                    </HStack>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      color={buttonIconColor}
                      _hover={{ color: buttonHoverBg }}
                      icon={<DeleteIcon />}
                      onClick={() => handleRemoveAnexo(index)}
                    />
                  </HStack>
                ))}
                <Button
                  as="label"
                  htmlFor="file-upload"
                  leftIcon={<AttachmentIcon />}
                  bg={buttonBg}
                  color="white"
                  _hover={{ bg: buttonHoverBg }}
                  size="sm"
                >
                  Subir Anexo
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    display="none"
                  />
                </Button>
              </VStack>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              bg={buttonBg}
              color="white"
              _hover={{ bg: buttonHoverBg }}
              mr={3}
              onClick={salvarNota}
            >
              Salvar
            </Button>
            <Button
              variant="ghost"
              color={textColor}
              onClick={onClose}
            >
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color={textColor}>Prévia da Imagem</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {previewImageUrl && (
              <Image
                src={previewImageUrl}
                alt="Prévia da imagem"
                maxH="70vh"
                maxW="100%"
                objectFit="contain"
                mx="auto"
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onPreviewClose}>
              Fechar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}