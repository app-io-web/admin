import { useState, useEffect } from 'react';
import {
  Box, Heading, Text, VStack, Button, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Input, useToast, useDisclosure
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import ToDoItem from './ToDoItem'; // mesmo componente reutilizável

export default function TarefasNaoAtrasadasCard({ setTemNaoAtrasadas }) {
  const [tarefas, setTarefas] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', dataEntrega: '' });
  const toast = useToast();

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario?.idUnico || 'user_123';

  const carregarTarefas = async () => {
    try {
      const res = await fetch(`https://api.kanban.nexusnerds.com.br/todos/${unicID_user}`);
      const data = await res.json();
      const filteredTarefas = (data.tarefas || []).filter(tarefa => !tarefa.kanban);
      setTarefas(filteredTarefas);
    } catch (err) {
      toast({ title: '❌ Erro ao carregar tarefas', status: 'error', duration: 3000 });
    }
  };

  const salvarTarefas = async (novasTarefas) => {
    try {
      const resCurrent = await fetch(`https://api.kanban.nexusnerds.com.br/todos/${unicID_user}`);
      const currentData = await resCurrent.json();
      const currentTarefas = currentData.tarefas || [];

      const updatedTarefas = [
        ...currentTarefas.filter(tarefa => tarefa.kanban),
        ...novasTarefas.filter(tarefa => !tarefa.kanban),
      ];

      await fetch('https://api.kanban.nexusnerds.com.br/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unicID_user,
          data: new Date().toISOString().split('T')[0],
          tarefas: updatedTarefas,
        }),
      });

      toast({ title: '✅ Tarefas salvas', status: 'success', duration: 2000 });
      await carregarTarefas();
    } catch {
      toast({ title: '❌ Erro ao salvar', status: 'error', duration: 3000 });
    }
  };


  useEffect(() => {
    carregarTarefas();
  }, []);


  // Filtra tarefas **não atrasadas**
  const tarefasNaoAtrasadas = tarefas.filter((tarefa) => {
    if (tarefa.feito) return false; // ⬅️ Exclui feitas!
    if (!tarefa.dataEntrega) return true; // ⬅️ Sem data = em andamento
    const hoje = new Date();
    const [ano, mes, dia] = tarefa.dataEntrega.split('-');
    const entrega = new Date(ano, mes - 1, dia);
    const diffDias = Math.ceil((entrega - hoje) / (1000 * 60 * 60 * 24));
    return diffDias >= 0; // ⬅️ Só tarefas com data futura ou hoje
  });
  

  const toggleTarefa = (id) => {
    const novas = tarefas.map((t) =>
      t.id === id ? { ...t, feito: !t.feito } : t
    );
    setTarefas(novas);
    salvarTarefas(novas);
  };

  const deletarTarefa = (id) => {
    const novas = tarefas.filter((t) => t.id !== id);
    setTarefas(novas);
    salvarTarefas(novas);
  };

  const editarTarefa = (id, tarefaAtualizada) => {
    const novas = tarefas.map((t) =>
      t.id === id ? { ...tarefaAtualizada, kanban: false } : t
    );
    setTarefas(novas);
    salvarTarefas(novas);
  };

  const adicionarTarefa = () => {
    if (!novaTarefa.titulo || !novaTarefa.dataEntrega) {
      toast({ title: 'Título e data são obrigatórios', status: 'warning', duration: 2000 });
      return;
    }

    const nova = {
      id: Date.now(),
      titulo: novaTarefa.titulo,
      dataEntrega: novaTarefa.dataEntrega,
      feito: false,
      checklist: [],
      kanban: false,
    };

    const novas = [...tarefas, nova];
    setTarefas(novas);
    salvarTarefas(novas);
    setNovaTarefa({ titulo: '', dataEntrega: '' });
    onClose();
  };

  useEffect(() => {
    console.log('tarefasNaoAtrasadas:', tarefasNaoAtrasadas);
    if (setTemNaoAtrasadas) {
      setTemNaoAtrasadas(tarefasNaoAtrasadas.length > 0);
    }
  }, [tarefasNaoAtrasadas]);



  if (!tarefasNaoAtrasadas.length) return null;

  return (
    <Box
      w={{ base: '90vw', md: '400px' }}
      maxW="100%"
      p={{ base: 4, md: 6 }}
      borderRadius="2xl"
      boxShadow="md"
      bg="white"
      _dark={{ bg: 'gray.800' }}
      mt={4}
    >
      <Heading size="md" mb={4}>
        Tarefas Não Atrasadas
      </Heading>
      <Button leftIcon={<AddIcon />} colorScheme="blue" size="sm" mb={4} onClick={onOpen}>
        Nova Tarefa
      </Button>
      {tarefasNaoAtrasadas && tarefasNaoAtrasadas.length > 0 ? (
  <VStack spacing={3} align="stretch">
    {tarefasNaoAtrasadas.slice(0, 3).map((tarefa) => (
      <ToDoItem
        key={tarefa.id}
        tarefa={tarefa}
        onToggle={toggleTarefa}
        onDelete={deletarTarefa}
        onEdit={editarTarefa}
      />
    ))}
    {tarefasNaoAtrasadas.length > 3 && (
      <Button
        variant="link"
        colorScheme="blue"
        size="sm"
        alignSelf="flex-start"
        onClick={() => window.location.href = '/tarefas'}
      >
        Ver Mais
      </Button>
    )}
  </VStack>
        ) : (
          <Text color="gray.500">Nenhuma tarefa em andamento.</Text>
        )}


      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nova Tarefa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Título"
              value={novaTarefa.titulo}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
              mb={3}
            />
            <Input
              type="date"
              placeholder="Data de entrega"
              value={novaTarefa.dataEntrega}
              onChange={(e) => setNovaTarefa({ ...novaTarefa, dataEntrega: e.target.value })}
              mb={3}
            />
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
