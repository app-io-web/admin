import { useState } from 'react';
import { HStack, Checkbox, IconButton, Box, Text, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Input, Button, VStack } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';

export default function ToDoItem({ tarefa, onToggle, onDelete, onEdit }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tituloEdit, setTituloEdit] = useState(tarefa.titulo);
  const [checklistEdit, setChecklistEdit] = useState(tarefa.checklist || []);
  const [dataEntregaEdit, setDataEntregaEdit] = useState(tarefa.dataEntrega || '');
  const [novoItemChecklist, setNovoItemChecklist] = useState('');

  // Editar o checklist individualmente
  const toggleChecklistItem = (id) => {
    setChecklistEdit(checklistEdit.map(item => item.id === id ? { ...item, feito: !item.feito } : item));
  };


  const adicionarChecklistItem = () => {
    if (!novoItemChecklist.trim()) return;
    setChecklistEdit([...checklistEdit, { id: Date.now(), titulo: novoItemChecklist, feito: false }]);
    setNovoItemChecklist('');
  };

  const salvarEdicao = () => {
    onEdit(tarefa.id, {
      ...tarefa,
      titulo: tituloEdit,
      dataEntrega: dataEntregaEdit,
      checklist: checklistEdit
    });
    onClose();
  };

  return (
    <>
      <HStack
        spacing={4}
        w="100%"
        p={2}
        borderRadius="md"
        bg={tarefa.feito ? 'gray.100' : 'transparent'}
        _dark={{ bg: tarefa.feito ? 'gray.700' : 'transparent' }}
        _hover={{ bg: 'gray.200', _dark: { bg: 'gray.600' }, cursor: 'pointer' }}
      >
        <Checkbox isChecked={tarefa.feito} onChange={() => onToggle(tarefa.id)} />
        <Box flex="1" onClick={onOpen}>
            <Text fontWeight="medium">{tarefa.titulo}</Text>
            {tarefa.dataEntrega && (() => {
                const hoje = new Date();
                const [ano, mes, dia] = tarefa.dataEntrega.split('-');
                const entrega = new Date(ano, mes - 1, dia);
                const diffDias = Math.ceil((entrega - hoje) / (1000 * 60 * 60 * 24));

                let tag = null;
                if (diffDias < 0) {
                  tag = (
                    <Text fontSize="xs" color="red.400">
                      🚨 Atrasada ({Math.abs(diffDias)} dia{Math.abs(diffDias) > 1 ? 's' : ''} em atraso)
                    </Text>
                  );
                } else if (diffDias === 0) {
                  tag = (
                    <Text fontSize="xs" color="orange.300">
                      📅 Para Hoje
                    </Text>
                  );
                } else {
                  tag = (
                    <Text fontSize="xs" color="green.400">
                      ⏳ Futura ({diffDias} dia{diffDias > 1 ? 's' : ''})
                    </Text>
                  );
                }

                return (
                  <>
                    <Text fontSize="xs" color="gray.500">
                      Entrega: {entrega.toLocaleDateString('pt-BR')}
                    </Text>
                    {tag}
                  </>
                );
              })()}

          </Box>
        <IconButton icon={<DeleteIcon />} onClick={() => onDelete(tarefa.id)} size="sm" aria-label="Remover tarefa" colorScheme="red" />
      </HStack>

      {/* Modal de Edição */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Tarefa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
              <Input placeholder="Título" value={tituloEdit} onChange={(e) => setTituloEdit(e.target.value)} mb={3} />
              <Input type="date" placeholder="Data de entrega" value={dataEntregaEdit} onChange={(e) => setDataEntregaEdit(e.target.value)} mb={3} />

              {tarefa.anexo && (
                <Box mb={3}>
                  <Text fontSize="sm" color="gray.500" mb={2}>Anexo:</Text>
                  <Box border="1px solid" borderColor="gray.300" borderRadius="md" overflow="hidden">
                    <img src={tarefa.anexo} alt="Anexo" style={{ width: '100%', objectFit: 'cover' }} />
                  </Box>
                  <Button 
                    as="a" 
                    href={tarefa.anexo} 
                    download 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    colorScheme="green" 
                    size="sm" 
                    mt={2}
                  >
                    📥 Baixar Anexo
                  </Button>
                </Box>
              )}

              {/* Checklist */}
              <Text fontSize="sm" fontWeight="bold" mb={2}>Checklist:</Text>
              <VStack align="start" mb={3}>
                {checklistEdit.map(item => (
                  <Checkbox key={item.id} isChecked={item.feito || false} onChange={() => toggleChecklistItem(item.id)}>
                    {item.titulo}
                  </Checkbox>
                ))}
              </VStack>

              {/* Adicionar novo item checklist */}
              <HStack>
                <Input placeholder="Novo item checklist" value={novoItemChecklist} onChange={(e) => setNovoItemChecklist(e.target.value)} />
                <Button onClick={adicionarChecklistItem}>+</Button>
              </HStack>
            </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" onClick={salvarEdicao}>Salvar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
