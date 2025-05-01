import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Button,
  useToast,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useDisclosure,
  useColorModeValue,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import ToDoItem from './ToDoItem';

export default function ToDoList() {
  const [tarefas, setTarefas] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [anexo, setAnexo] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [novoItemChecklist, setNovoItemChecklist] = useState('');
  const [shouldSave, setShouldSave] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario?.idUnico || 'user_123';

  const checklistBg = useColorModeValue('gray.100', 'gray.700');
  const checklistTextColor = useColorModeValue('gray.800', 'white');

  const carregarTarefas = async () => {
    try {
      const res = await fetch(`https://api.kanban.nexusnerds.com.br/todos/${unicID_user}`);
      const data = await res.json();
      const filteredTarefas = (data.tarefas || []).filter(tarefa => !tarefa.kanban);
      console.log('Tarefas carregadas:', filteredTarefas); // Log para depuração
      setTarefas(filteredTarefas);
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
      toast({ title: '❌ Erro ao carregar tarefas', status: 'error', duration: 3000 });
    }
  };

  const salvarTarefas = async (novasTarefas) => {
    try {
      const resCurrent = await fetch(`https://api.kanban.nexusnerds.com.br/todos/${unicID_user}`);
      const currentData = await resCurrent.json();
      const currentTarefas = currentData.tarefas || [];
      console.log('Tarefas atuais do backend:', currentTarefas);
  
      const updatedTarefas = [
        ...currentTarefas.filter(tarefa => tarefa.kanban),
        ...novasTarefas.filter(tarefa => !tarefa.kanban),
      ];
      console.log('Tarefas enviadas ao backend:', updatedTarefas);
  
      const res = await fetch('https://api.kanban.nexusnerds.com.br/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unicID_user,
          data: new Date().toISOString().split('T')[0],
          tarefas: updatedTarefas,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar tarefas');
      toast({ title: '✅ Tarefas salvas', status: 'success', duration: 2000 });
      await carregarTarefas();
    } catch (err) {
      console.error('Erro ao salvar tarefas:', err);
      toast({ title: '❌ Erro ao salvar', status: 'error', duration: 3000 });
    }
  };

  useEffect(() => {
    carregarTarefas();
  }, []);

  useEffect(() => {
    if (shouldSave) {
      salvarTarefas(tarefas);
      setShouldSave(false);
    }
  }, [tarefas, shouldSave]);

  const adicionarChecklistItem = () => {
    if (novoItemChecklist.trim()) {
      setChecklist([...checklist, { id: Date.now(), titulo: novoItemChecklist, feito: false }]);
      setNovoItemChecklist('');
    }
  };

  const adicionarTarefa = async () => {
    if (!titulo.trim()) {
      toast({ title: 'Título é obrigatório', status: 'warning', duration: 2000 });
      return;
    }

    let urlAnexo = null;

    if (anexo) {
      const nomeArquivoSemEspacos = anexo.name.replace(/\s+/g, '_');
      const anexoCorrigido = new File([anexo], nomeArquivoSemEspacos, { type: anexo.type });
      const formData = new FormData();
      const nomeArquivoCorrigido = encodeURIComponent(nomeArquivoSemEspacos);
      formData.append('file', anexoCorrigido);
      formData.append('size', anexoCorrigido.size);
      formData.append('title', nomeArquivoCorrigido);
      formData.append('path', `/${Date.now()}_${nomeArquivoCorrigido}`);

      try {
        const res = await fetch('https://nocodb.nexusnerds.com.br/api/v2/storage/upload', {
          method: 'POST',
          headers: { 'xc-token': 'PQFnWUYFjMfX7aAVow3zO11oNhyvQugsPoYWDVw6' },
          body: formData,
        });

        const result = await res.json();
        const path = result?.[0]?.path;
        if (!path) throw new Error('URL não retornada corretamente');
        urlAnexo = `https://nocodb.nexusnerds.com.br/${path}`;
      } catch (err) {
        console.error('Erro no upload:', err);
        toast({ title: 'Erro ao fazer upload', status: 'error', duration: 3000 });
        return;
      }
    }

    const nova = {
      id: Date.now(),
      titulo,
      feito: false,
      dataEntrega,
      anexo: urlAnexo,
      checklist,
      kanban: false,
    };

    setTarefas([...tarefas, nova]);
    setShouldSave(true);
    onClose();
    setTitulo('');
    setDataEntrega('');
    setAnexo(null);
    setChecklist([]);
  };

  const handleToggle = (id) => {
    setTarefas(tarefas.map(t => (t.id === id ? { ...t, feito: !t.feito } : t)));
    setShouldSave(true);
  };

  const handleDelete = (id) => {
    console.log('Deletando tarefa com ID:', id); // Log para depuração
    setTarefas(tarefas.filter(t => t.id !== id));
    setShouldSave(true);
  };

  const handleEdit = (id, dadosAtualizados) => {
    setTarefas(tarefas.map(t => (t.id === id ? { ...dadosAtualizados, kanban: false } : t)));
    setShouldSave(true);
  };

  return (
    <Box p={4} maxW="md" mx="auto">
      <Heading size="lg" mb={4}>To-Do List</Heading>
      <VStack spacing={3} align="stretch">
        {tarefas
          .filter(tarefa => !tarefa.kanban)
          .map(tarefa => (
            <ToDoItem
              key={tarefa.id}
              tarefa={tarefa}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
          Nova Tarefa
        </Button>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adicionar Nova Tarefa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Título da tarefa"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              mb={3}
            />
            <Input
              type="date"
              placeholder="Data de entrega"
              value={dataEntrega}
              onChange={e => setDataEntrega(e.target.value)}
              mb={3}
            />
            <Box
              border="2px dashed"
              borderColor="gray.300"
              borderRadius="md"
              p={4}
              textAlign="center"
              _hover={{ borderColor: 'blue.400' }}
              cursor="pointer"
              onClick={() => document.getElementById('input-anexo').click()}
            >
              {anexo ? (
                <Box color="green.500" fontWeight="bold">
                  📎 {anexo.name}
                </Box>
              ) : (
                <Box color="gray.500">Clique para adicionar um anexo</Box>
              )}
            </Box>
            <Input
              id="input-anexo"
              type="file"
              display="none"
              onChange={e => setAnexo(e.target.files[0])}
            />
            <Heading size="sm" mb={2}>
              Checklist
            </Heading>
            {checklist.map(item => (
              <Box
                key={item.id}
                mb={1}
                p={2}
                bg={checklistBg}
                color={checklistTextColor}
                borderRadius="md"
              >
                {item.titulo}
              </Box>
            ))}
            <HStack mt={2}>
              <Input
                placeholder="Novo item checklist"
                value={novoItemChecklist}
                onChange={e => setNovoItemChecklist(e.target.value)}
              />
              <Button onClick={adicionarChecklistItem}>+</Button>
            </HStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={adicionarTarefa}>
              Adicionar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}