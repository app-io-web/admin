import { useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Input, useToast, useDisclosure } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import ToDoItem from './ToDoItem'; // Ajuste o caminho conforme necessário


export default function TarefasNaoAtrasadasCard({ setTemAtrasadas }) {
  const [tarefas, setTarefas] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', dataEntrega: '' });
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario?.idUnico || 'user_123';


  // 🔥 1. Declaração de tarefas atrasadas (em cima, antes de qualquer useEffect)
  const tarefasAtrasadas = tarefas.filter((tarefa) => {
    if (!tarefa.dataEntrega || tarefa.feito) return false;
    const hoje = new Date();
    const [ano, mes, dia] = tarefa.dataEntrega.split('-');
    const entrega = new Date(ano, mes - 1, dia);
    const diffDias = Math.ceil((entrega - hoje) / (1000 * 60 * 60 * 24));
    return diffDias < 0;  // 🔥 remove o modalVisto daqui
  });




  // 🔥 2. UseEffect para abrir modal e controlar setTemAtrasadas
  useEffect(() => {
    const temNaoVisto = tarefasAtrasadas.some((t) => !t.modalVisto);
    if (tarefasAtrasadas.length > 0) {
      setTemAtrasadas(true);
      if (temNaoVisto) openModal();
    } else {
      setTemAtrasadas(false);
    }
  }, [tarefas, openModal, setTemAtrasadas]); // Depende de tarefas, não de tarefasAtrasadas


    // 🔥 3. Outro UseEffect só pra log se quiser
    useEffect(() => {
      console.log('tarefasAtrasadas:', tarefasAtrasadas);
    }, [tarefas]);

  const handleFecharModal = () => {
    sessionStorage.setItem('modalTarefasAtrasadasVisto', 'true');
    setModalVisto(true);
    closeModal();
  };



  // Função para carregar tarefas da API
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


    // 🔥 Checa se o modal já foi visto na sessão
  const [modalVisto, setModalVisto] = useState(() => {
    return sessionStorage.getItem('modalTarefasAtrasadasVisto') === 'true';
  });


  // Função para salvar tarefas na API
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

  // Carregar tarefas ao montar o componente
  useEffect(() => {
    carregarTarefas();
  }, []);

  // Filtrar tarefas atrasadas
  const marcarModalComoVisto = async () => {
    const tarefasAtualizadas = tarefas.map(tarefa => {
      if (!tarefa.dataEntrega || tarefa.feito) return tarefa;
  
      const hoje = new Date();
      const [ano, mes, dia] = tarefa.dataEntrega.split('-');
      const entrega = new Date(ano, mes - 1, dia);
      const diffDias = Math.ceil((entrega - hoje) / (1000 * 60 * 60 * 24));
  
      if (diffDias < 0 && !tarefa.modalVisto) {
        return { ...tarefa, modalVisto: true }; // Atualiza o campo
      }
      return tarefa;
    });
  
    setTarefas(tarefasAtualizadas);
    await salvarTarefas(tarefasAtualizadas); // Salva no backend
    closeModal();
  };
  







  // Funções para manipular tarefas
  const toggleTarefa = (id) => {
    const novasTarefas = tarefas.map((tarefa) =>
      tarefa.id === id ? { ...tarefa, feito: !tarefa.feito } : tarefa
    );
    setTarefas(novasTarefas);
    salvarTarefas(novasTarefas);
  };

  const deletarTarefa = (id) => {
    const novasTarefas = tarefas.filter((tarefa) => tarefa.id !== id);
    setTarefas(novasTarefas);
    salvarTarefas(novasTarefas);
  };

  const editarTarefa = (id, tarefaAtualizada) => {
    const novasTarefas = tarefas.map((tarefa) =>
      tarefa.id === id ? { ...tarefaAtualizada, kanban: false } : tarefa
    );
    setTarefas(novasTarefas);
    salvarTarefas(novasTarefas);
  };

  const adicionarTarefa = async () => {
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

    const novasTarefas = [...tarefas, nova];
    setTarefas(novasTarefas);
    salvarTarefas(novasTarefas);
    setNovaTarefa({ titulo: '', dataEntrega: '' });
    onClose();
  };

  useEffect(() => {
    console.log('tarefasAtrasadas:', tarefasAtrasadas);
    if (setTemAtrasadas) {
      setTemAtrasadas(tarefasAtrasadas.length > 0);
    }
  }, [tarefasAtrasadas]);
  

    // Esconde o card se não tiver tarefas atrasadas
  if (tarefasAtrasadas.length === 0) return null;

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
        Tarefas em Atraso
      </Heading>
      {tarefasAtrasadas && tarefasAtrasadas.length > 0 ? (
  <VStack spacing={3} align="stretch">
    {tarefasAtrasadas.slice(0, 3).map((tarefa) => (
      <ToDoItem
        key={tarefa.id}
        tarefa={tarefa}
        onToggle={toggleTarefa}
        onDelete={deletarTarefa}
        onEdit={editarTarefa}
      />
    ))}
    {tarefasAtrasadas.length > 3 && (
      <Button
        variant="link"
        colorScheme="blue"
        size="sm"
        alignSelf="flex-start"
        onClick={() => window.location.href = '/tarefas'} // Redireciona para página de tarefas
      >
        Ver Mais
      </Button>
    )}
  </VStack>
        ) : (
          <Text color="gray.500">Nenhuma tarefa em atraso.</Text>
        )}


      {/* Modal para adicionar nova tarefa */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adicionar Nova Tarefa</ModalHeader>
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


            {/* 🔥 Modal informativo */}
            <Modal isOpen={isModalOpen} onClose={marcarModalComoVisto}>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Atenção: Tarefas em Atraso</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    Você possui tarefas em atraso. Não se esqueça de atualizá-las o quanto antes!
                  </ModalBody>
                  <ModalFooter>
                    <Button colorScheme="blue" onClick={marcarModalComoVisto}>Entendi</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

    </Box>
  );
}