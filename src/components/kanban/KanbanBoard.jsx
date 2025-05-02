import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Flex,
  Button,
  Input,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { useParams } from 'react-router-dom';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';
import SideBar from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';

export default function KanbanBoard() {
  const [tarefas, setTarefas] = useState([]);
  const [colunas, setColunas] = useState([
    { id: 'todo', titulo: 'A Fazer' },
    { id: 'doing', titulo: 'Em Progresso' },
    { id: 'done', titulo: 'Concluído' },
  ]);
  const [boardName, setBoardName] = useState('Kanban Board');
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedTarefa, setSelectedTarefa] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldSave, setShouldSave] = useState(false);

  const { boardId } = useParams();
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario?.idUnico ;
  const bg = useColorModeValue('white', 'gray.900');
  const toast = useToast();

  const defaultColumnIds = ['todo', 'doing', 'done'];

  const carregarBoard = async () => {
    try {
      const res = await fetch(`https://api.kanban.nexusnerds.com.br/kanban/boards/${unicID_user}/${boardId}`);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setBoardName(data.name || 'Kanban Board');
      setColunas(data.columns || defaultColumnIds.map(id => ({ id, titulo: id.charAt(0).toUpperCase() + id.slice(1) })));
      setTarefas(data.tasks || []);
    } catch (err) {
      console.error('Erro ao carregar board:', err);
      toast({ title: '❌ Erro ao carregar board', status: 'error', duration: 3000 });
    }
  };

  const salvarBoard = async (novasTarefas, novasColunas) => {
    try {
      const resCurrent = await fetch(`https://api.kanban.nexusnerds.com.br/todos/${unicID_user}`);
      const currentData = await resCurrent.json();
      const currentKanbanBoards = currentData.kanban_boards || [];
      const currentTarefas = currentData.tarefas || [];

      const updatedKanbanBoards = currentKanbanBoards.filter(b => b.board_id !== boardId);
      updatedKanbanBoards.push({
        board_id: boardId,
        name: boardName,
        columns: novasColunas || colunas,
      });

      const updatedTarefas = [
        ...currentTarefas.filter(t => !t.kanban || t.board_id !== boardId),
        ...(novasTarefas || tarefas),
      ];

      const res = await fetch('https://api.kanban.nexusnerds.com.br/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unicID_user,
          data: new Date().toISOString().split('T')[0],
          tarefas: updatedTarefas,
          kanban_boards: updatedKanbanBoards,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Erro ao salvar board: ${errorData.error || res.statusText}`);
      }
      //console.log('Board salvo com sucesso');
    } catch (err) {
      console.error('Erro ao salvar board:', err);
      toast({ title: '❌ Erro ao salvar board', status: 'error', duration: 3000 });
    }
  };

  useEffect(() => {
    if (boardId) {
      carregarBoard();
    }
  }, [boardId]);

  useEffect(() => {
    if (shouldSave && tarefas.length) {
      salvarBoard(tarefas, colunas);
      setShouldSave(false);
    }
  }, [tarefas, shouldSave]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      //console.log('Drag cancelado: sem destino');
      return;
    }

    const tarefaId = active.id;
    const novaColuna = over.id;

    if (!colunas.some(col => col.id === novaColuna)) {
      console.warn(`Coluna inválida: ${novaColuna}`);
      return;
    }

    //console.log(`Movendo tarefa ${tarefaId} para coluna ${novaColuna}`);
    setTarefas(tarefas.map(t =>
      t.id === tarefaId ? { ...t, status: novaColuna } : t
    ));
    setShouldSave(true);
  };

  const adicionarColuna = () => {
    const novaColuna = { id: `coluna-${Date.now()}`, titulo: 'Nova Coluna' };
    const atualizadas = [...colunas, novaColuna];
    setColunas(atualizadas);
    salvarBoard(tarefas, atualizadas);
  };

  const atualizarTituloColuna = (colunaId, novoTitulo) => {
    const atualizadas = colunas.map(coluna =>
      coluna.id === colunaId ? { ...coluna, titulo: novoTitulo } : coluna
    );
    setColunas(atualizadas);
    salvarBoard(tarefas, atualizadas);
  };

  const adicionarTarefa = (colunaId) => {
    if (!colunas.some(col => col.id === colunaId)) {
      console.warn(`Tentativa de adicionar tarefa a uma coluna inexistente: ${colunaId}`);
      return;
    }

    const novaTarefa = {
      id: Date.now(),
      titulo: 'Nova Tarefa',
      status: colunaId,
      feito: false,
      descricao: '',
      anexos: [],
      comentarios: [],
      checklist: [],
      kanban: true,
      board_id: boardId,
    };
    const novasTarefas = [...tarefas, novaTarefa];
    setTarefas(novasTarefas);
    setShouldSave(true);
    openModal(novaTarefa);
  };

  const deletarColuna = (colunaId) => {
    const novasColunas = colunas.filter(coluna => coluna.id !== colunaId);
    const novasTarefas = tarefas.map(tarefa =>
      tarefa.status === colunaId ? { ...tarefa, status: 'todo' } : tarefa
    );
    setColunas(novasColunas);
    setTarefas(novasTarefas);
    salvarBoard(novasTarefas, novasColunas);
  };

  const atualizarTarefa = (updatedTarefa) => {
    const novasTarefas = tarefas.map(t =>
      t.id === updatedTarefa.id ? { ...updatedTarefa, kanban: true, board_id: boardId } : t
    );
    setTarefas(novasTarefas);
    setShouldSave(true);
  };

  const deletarTarefa = (tarefaId) => {
    const novasTarefas = tarefas.filter(t => t.id !== tarefaId);
    setTarefas(novasTarefas);
    setShouldSave(true);
  };

  const openModal = (tarefa) => {
    setSelectedTarefa(tarefa);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTarefa(null);
  };

  const handleNameChange = () => {
    if (boardName.trim()) {
      setIsEditingName(false);
      salvarBoard(tarefas, colunas);
    } else {
      toast({ title: 'Nome do board é obrigatório', status: 'warning', duration: 2000 });
    }
  };

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />

      <Box
        position="fixed"
        top="20px"
        right="24px"
        zIndex={30}
        display={{ base: 'none', md: 'block' }}
      >
        <PerfilUsuarioDesktop usuario={usuario} />
      </Box>

      <Box
        flex="1"
        px={{ base: 4, md: 6 }}
        pt={{ base: 4, md: 24 }} // Aumentado o padding-top para desktops (md)
        pb={{ base: 24, md: 6 }}
        minH="100vh"
        overflowX="hidden"
        overflowY="auto"
        bg={bg}
      >
        <Flex justify="space-between" mb={4} direction={{ base: 'column', sm: 'row' }} gap={4}>
          {isEditingName ? (
            <Input
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              onBlur={handleNameChange}
              onKeyPress={(e) => e.key === 'Enter' && handleNameChange()}
              size="lg"
              autoFocus
            />
          ) : (
            <Heading
              fontSize={{ base: 'xl', md: '2xl' }}
              onClick={() => setIsEditingName(true)}
              cursor="pointer"
            >
              📊 {boardName}
            </Heading>
          )}
          <Button colorScheme="blue" size="sm" onClick={adicionarColuna}>
            + Adicionar Coluna
          </Button>
        </Flex>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Box overflowX="hidden" width="100%">
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              align={{ base: 'stretch', sm: 'start' }}
              gap={4}
              width="100%"
              flexWrap="nowrap"
              overflow="hidden"
            >
              {colunas.map(coluna => (
                <KanbanColumn
                  key={coluna.id}
                  coluna={coluna}
                  tarefas={tarefas.filter(t => t.status === coluna.id)}
                  onAtualizarTitulo={atualizarTituloColuna}
                  onAdicionarTarefa={adicionarTarefa}
                  onDeletarColuna={deletarColuna}
                  isDefault={defaultColumnIds.includes(coluna.id)}
                  onOpenModal={openModal}
                />
              ))}
            </Flex>
          </Box>
        </DndContext>
        {selectedTarefa && (
          <TaskModal
            isOpen={isModalOpen}
            onClose={closeModal}
            tarefa={selectedTarefa}
            onSave={atualizarTarefa}
            onDelete={deletarTarefa}
          />
        )}
      </Box>

      <BottomBar />
    </Box>
  );
}