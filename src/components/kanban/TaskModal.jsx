import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Textarea,
  Checkbox,
  VStack,
  Text,
  Box,
  useColorModeValue,
  IconButton,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { FiTrash2, FiPlus, FiEye } from 'react-icons/fi';

export default function TaskModal({ isOpen, onClose, tarefa, onSave, onDelete }) {
  const [titulo, setTitulo] = useState(tarefa?.titulo || '');
  const [descricao, setDescricao] = useState(tarefa?.descricao || '');
  const [feito, setFeito] = useState(tarefa?.feito || false);
  const [anexos, setAnexos] = useState(tarefa?.anexos || []);
  const [comentarios, setComentarios] = useState(tarefa?.comentarios || []);
  const [checklist, setChecklist] = useState(tarefa?.checklist || []);
  const [novoComentario, setNovoComentario] = useState('');
  const [novoItemChecklist, setNovoItemChecklist] = useState('');
  const [mostrarAnexos, setMostrarAnexos] = useState(false);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (tarefa) {
      setTitulo(tarefa.titulo || '');
      setDescricao(tarefa.descricao || '');
      setFeito(tarefa.feito || false);
      setAnexos(tarefa.anexos || []);
      setComentarios(tarefa.comentarios || []);
      setChecklist(tarefa.checklist || []);
    }
  }, [tarefa]);

  const handleSave = () => {
    // Clean anexos to exclude tempUrl before saving
    const cleanedAnexos = anexos.map(({ tempUrl, ...rest }) => rest);
    onSave({
      ...tarefa,
      titulo,
      descricao,
      feito,
      anexos: cleanedAnexos,
      comentarios,
      checklist,
    });
    onClose();
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAnexos = files.map(file => ({
      name: file.name,
      type: file.type,
      tempUrl: URL.createObjectURL(file), // Temporary for UI preview
    }));
    setAnexos([...anexos, ...newAnexos]);
  };

  const adicionarComentario = () => {
    if (novoComentario.trim()) {
      setComentarios([
        ...comentarios,
        {
          id: Date.now(),
          texto: novoComentario,
          data: new Date().toISOString(),
        },
      ]);
      setNovoComentario('');
    }
  };

  const adicionarItemChecklist = () => {
    if (novoItemChecklist.trim()) {
      setChecklist([
        ...checklist,
        {
          id: Date.now(),
          texto: novoItemChecklist,
          concluido: false,
        },
      ]);
      setNovoItemChecklist('');
    }
  };

  const toggleItemChecklist = (id) => {
    setChecklist(
      checklist.map(item =>
        item.id === id ? { ...item, concluido: !item.concluido } : item
      )
    );
  };

  const deletarItemChecklist = (id) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handleDelete = () => {
    onDelete(tarefa.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bg}>
        <ModalHeader>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            variant="flushed"
            fontSize="xl"
            fontWeight="bold"
            placeholder="Título da tarefa"
          />
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Descrição */}
            <Box>
              <Text fontWeight="bold" mb={2}>Descrição</Text>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Adicione uma descrição..."
                borderColor={borderColor}
                minH="100px"
              />
            </Box>

            {/* Status Concluído */}
            <Box>
              <Checkbox
                isChecked={feito}
                onChange={(e) => setFeito(e.target.checked)}
                colorScheme="teal"
              >
                Concluído
              </Checkbox>
            </Box>

            {/* Checklist (Accordion) */}
            <Box>
              <Text fontWeight="bold" mb={2}>Checklist</Text>
              <Accordion allowToggle>
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      Checklist ({checklist.length} itens)
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Flex mb={2}>
                      <Input
                        value={novoItemChecklist}
                        onChange={(e) => setNovoItemChecklist(e.target.value)}
                        placeholder="Adicionar item à checklist"
                        mr={2}
                      />
                      <Button
                        colorScheme="teal"
                        size="sm"
                        onClick={adicionarItemChecklist}
                        isDisabled={!novoItemChecklist.trim()}
                      >
                        <FiPlus />
                      </Button>
                    </Flex>
                    {checklist.length > 0 && (
                      <VStack spacing={2} align="stretch">
                        {checklist.map(item => (
                          <Flex key={item.id} align="center">
                            <Checkbox
                              isChecked={item.concluido}
                              onChange={() => toggleItemChecklist(item.id)}
                              colorScheme="teal"
                              flex="1"
                            >
                              <Text fontSize="sm">{item.texto}</Text>
                            </Checkbox>
                            <IconButton
                              icon={<FiTrash2 />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => deletarItemChecklist(item.id)}
                              aria-label="Deletar item da checklist"
                            />
                          </Flex>
                        ))}
                      </VStack>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>

            {/* Anexos (Toggle Visibility) */}
            <Box>
              <Text fontWeight="bold" mb={2}>Anexos</Text>
              <Button
                colorScheme="teal"
                size="sm"
                leftIcon={<FiEye />}
                onClick={() => setMostrarAnexos(!mostrarAnexos)}
                mb={2}
              >
                {mostrarAnexos ? 'Ocultar Anexos' : 'Mostrar Anexos'}
              </Button>
              <Input
                type="file"
                accept="image/*,video/*,application/pdf"
                multiple
                onChange={handleFileUpload}
                display="none"
                id={`file-upload-${tarefa?.id}`}
              />
              <Button
                as="label"
                htmlFor={`file-upload-${tarefa?.id}`}
                colorScheme="teal"
                size="sm"
                mb={2}
                ml={2}
              >
                + Adicionar Anexo
              </Button>
              {mostrarAnexos && anexos.length > 0 && (
                <VStack spacing={2} align="stretch">
                  {anexos.map((anexo, index) => (
                    <Box key={index} p={2} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                      {anexo.type.startsWith('image/') && anexo.tempUrl && (
                        <img src={anexo.tempUrl} alt={anexo.name} style={{ maxWidth: '100%', maxHeight: '200px' }} />
                      )}
                      {anexo.type.startsWith('video/') && anexo.tempUrl && (
                        <video controls style={{ maxWidth: '100%', maxHeight: '200px' }}>
                          <source src={anexo.tempUrl} type={anexo.type} />
                        </video>
                      )}
                      {anexo.type === 'application/pdf' && anexo.tempUrl && (
                        <a href={anexo.tempUrl} target="_blank" rel="noopener noreferrer">
                          {anexo.name}
                        </a>
                      )}
                      <Text fontSize="sm">{anexo.name}</Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>

            {/* Comentários (Moved to Bottom) */}
            <Box>
              <Text fontWeight="bold" mb={2}>Comentários</Text>
              <Flex mb={2}>
                <Textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Adicionar um comentário..."
                  borderColor={borderColor}
                  mr={2}
                />
                <Button
                  colorScheme="teal"
                  size="sm"
                  onClick={adicionarComentario}
                  isDisabled={!novoComentario.trim()}
                >
                  Adicionar
                </Button>
              </Flex>
              {comentarios.length > 0 && (
                <VStack spacing={2} align="stretch">
                  {comentarios.map(comentario => (
                    <Box
                      key={comentario.id}
                      p={2}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="md"
                    >
                      <Text fontSize="sm">{comentario.texto}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(comentario.data).toLocaleString('pt-BR')}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="red" variant="outline" onClick={handleDelete} mr={3}>
            Deletar Tarefa
          </Button>
          <Button colorScheme="teal" onClick={handleSave} mr={3}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}