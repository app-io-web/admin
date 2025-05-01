import { useState, useEffect } from 'react';
import {
  VStack,
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useToast,
  Icon,
  HStack,
  IconButton,
  Spinner,
  Text,
  Box,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { AddIcon, ChevronDownIcon, ChevronRightIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { usePermissions } from '../../../context/PermissionsContext';
import PropTypes from 'prop-types';

export default function MenuTarefas({ isCollapsed, isActive, search }) {
  const [kanbanBoards, setKanbanBoards] = useState([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKanbanOpen, setIsKanbanOpen] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editingBoardName, setEditingBoardName] = useState('');
  const toast = useToast();
  const { hasPermission, isLoading, error } = usePermissions();

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario?.idUnico;

  const itens = [
    { label: 'Minhas Tarefas', path: '/tarefas', permission: 'PERM-[USER-A.N0-MINHAS-TAREFAS]' },
    {
      label: 'Adicionar Tarefas Calendario',
      path: '/tasks-and-kanban',
      permission: 'PERM-[USER-A.N0-ADICIONAR-TAREFAS-CALENDARIO]',
    },
    { label: 'Calendario', path: '/calendar', permission: 'PERM-[USER-A.N0-CALENDARIO]' },
    { label: 'Notas', path: '/notas', permission: 'PERM-[USER-A.N0-NOTAS]' },
  ];

  const canAccessKanban = hasPermission('PERM-[USER-A.N0-KANBAN]');

  const carregarBoards = async () => {
    try {
      const res = await fetch(`https://api.kanban.nexusnerds.com.br/kanban/boards/${unicID_user}`);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setKanbanBoards(data);
    } catch (err) {
      console.error('Erro ao carregar boards:', err);
      toast({ title: 'Erro ao carregar boards', status: 'error', duration: 3000 });
    }
  };

  const criarBoard = async () => {
    if (!newBoardName.trim()) {
      toast({ title: 'Nome do board é obrigatório', status: 'warning', duration: 2000 });
      return;
    }

    try {
      const resCurrent = await fetch(`https://api.kanban.nexusnerds.com.br/todos/${unicID_user}`);
      const currentData = await resCurrent.json();
      const currentKanbanBoards = currentData.kanban_boards || [];
      const currentTarefas = currentData.tarefas || [];

      const newBoard = {
        board_id: `board_${Date.now()}`,
        name: newBoardName,
        columns: [
          { id: 'todo', titulo: 'A Fazer' },
          { id: 'doing', titulo: 'Em Progresso' },
          { id: 'done', titulo: 'Concluído' },
        ],
      };

      const updatedKanbanBoards = [...currentKanbanBoards, newBoard];

      const res = await fetch('https://api.kanban.nexusnerds.com.br/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unicID_user,
          data: new Date().toISOString().split('T')[0],
          tarefas: currentTarefas,
          kanban_boards: updatedKanbanBoards,
        }),
      });
      if (!res.ok) throw new Error('Erro ao criar board');
      setKanbanBoards(updatedKanbanBoards);
      setNewBoardName('');
      setIsModalOpen(false);
      toast({ title: '✅ Board criado', status: 'success', duration: 2000 });
    } catch (err) {
      console.error('Erro ao criar board:', err);
      toast({ title: '❌ Erro ao criar board', status: 'error', duration: 3000 });
    }
  };

  const atualizarBoard = async (boardId, novoNome) => {
    if (!novoNome.trim()) {
      toast({ title: 'Nome do board é obrigatório', status: 'warning', duration: 2000 });
      return;
    }

    try {
      const resCurrent = await fetch(`https://api.kanban.nexusnerds.com.br/todos/${unicID_user}`);
      const currentData = await resCurrent.json();
      const currentKanbanBoards = currentData.kanban_boards || [];
      const currentTarefas = currentData.tarefas || [];

      const updatedKanbanBoards = currentKanbanBoards.map(board =>
        board.board_id === boardId ? { ...board, name: novoNome } : board
      );

      const res = await fetch('https://api.kanban.nexusnerds.com.br/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unicID_user,
          data: new Date().toISOString().split('T')[0],
          tarefas: currentTarefas,
          kanban_boards: updatedKanbanBoards,
        }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar board');
      setKanbanBoards(updatedKanbanBoards);
      toast({ title: '✅ Board atualizado', status: 'success', duration: 2000 });
    } catch (err) {
      console.error('Erro ao atualizar board:', err);
      toast({ title: '❌ Erro ao atualizar board', status: 'error', duration: 3000 });
    }
  };

  const deletarBoard = async (boardId) => {
    try {
      const resCurrent = await fetch(`https://api.kanban.nexusnerds.com.br/todos/${unicID_user}`);
      const currentData = await resCurrent.json();
      const currentKanbanBoards = currentData.kanban_boards || [];
      const currentTarefas = currentData.tarefas || [];

      const updatedKanbanBoards = currentKanbanBoards.filter(board => board.board_id !== boardId);
      const updatedTarefas = currentTarefas.filter(tarefa => !tarefa.kanban || tarefa.board_id !== boardId);

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
      if (!res.ok) throw new Error('Erro ao deletar board');
      setKanbanBoards(updatedKanbanBoards);
      toast({ title: '✅ Board deletado', status: 'success', duration: 2000 });
    } catch (err) {
      console.error('Erro ao deletar board:', err);
      toast({ title: '❌ Erro ao deletar board', status: 'error', duration: 3000 });
    }
  };

  const iniciarEdicao = (board) => {
    setEditingBoardId(board.board_id);
    setEditingBoardName(board.name);
  };

  const salvarEdicao = (boardId) => {
    atualizarBoard(boardId, editingBoardName);
    setEditingBoardId(null);
    setEditingBoardName('');
  };

  useEffect(() => {
    if (canAccessKanban) {
      carregarBoards();
    }
  }, [canAccessKanban]);

  const itensFiltrados = itens
    .filter((item) => !item.permission || hasPermission(item.permission))
    .filter((item) => item.label.toLowerCase().includes(search.toLowerCase().trim()));

  const kanbanFiltrados = kanbanBoards.filter((board) =>
    board.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <Spinner size="md" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <Text color="red.500" fontSize="sm">{error}</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={2}>
      {itensFiltrados.length > 0 || (canAccessKanban && isKanbanOpen) ? (
        <>
          {itensFiltrados.map((item) => (
            <Link to={item.path} key={item.path}>
              <Button
                variant="ghost"
                justifyContent={isCollapsed ? 'center' : 'flex-start'}
                colorScheme={isActive(item.path) ? 'blue' : 'gray'}
              >
                {!isCollapsed && item.label}
              </Button>
            </Link>
          ))}
          {canAccessKanban && (
            <>
              <Button
                variant="ghost"
                justifyContent={isCollapsed ? 'center' : 'flex-start'}
                onClick={() => setIsKanbanOpen(!isKanbanOpen)}
                leftIcon={isKanbanOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
              >
                {!isCollapsed && 'Kanbans'}
              </Button>
              {isKanbanOpen && !isCollapsed && (
                <VStack align="stretch" pl={4} spacing={1}>
                  {kanbanFiltrados.map((board) => (
                    <HStack key={board.board_id} spacing={1} align="center">
                      {editingBoardId === board.board_id ? (
                        <HStack flex="1">
                          <Input
                            value={editingBoardName}
                            onChange={(e) => setEditingBoardName(e.target.value)}
                            onBlur={() => salvarEdicao(board.board_id)}
                            onKeyPress={(e) => e.key === 'Enter' && salvarEdicao(board.board_id)}
                            size="sm"
                            autoFocus
                          />
                        </HStack>
                      ) : (
                        <Link to={`/kanban/${board.board_id}`} style={{ flex: 1 }}>
                          <Button
                            variant="ghost"
                            justifyContent="flex-start"
                            colorScheme={isActive(`/kanban/${board.board_id}`) ? 'blue' : 'gray'}
                            width="100%"
                          >
                            {board.name}
                          </Button>
                        </Link>
                      )}
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => iniciarEdicao(board)}
                        aria-label="Editar nome do board"
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => deletarBoard(board.board_id)}
                        aria-label="Deletar board"
                      />
                    </HStack>
                  ))}
                  <Button
                    leftIcon={<AddIcon />}
                    variant="ghost"
                    justifyContent="flex-start"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Novo Kanban Board
                  </Button>
                </VStack>
              )}
            </>
          )}
        </>
      ) : (
        <Text>Nenhum item disponível para suas permissões ou busca</Text>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Criar Novo Kanban Board</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Nome do board"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={criarBoard}>
              Criar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

MenuTarefas.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  isActive: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
};