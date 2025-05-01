import { useState } from 'react';
import { Box, Heading, VStack, Text, Card, CardBody, Input, Button, useColorModeValue, IconButton, Flex } from '@chakra-ui/react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiTrash2, FiMoreVertical } from 'react-icons/fi';

const SortableItem = ({ id, tarefa, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <Card variant="outline" bg={useColorModeValue('white', 'gray.800')}>
        <CardBody>
          <Flex align="center">
            {/* Drag Handle */}
            <Box
              {...listeners}
              {...attributes}
              cursor="grab"
              mr={2}
              onClick={(e) => e.stopPropagation()} // Prevent click on handle from opening modal
            >
              <FiMoreVertical /> {/* Replaced FiGripVertical with FiMoreVertical */}
            </Box>
            {/* Task Content */}
            <Box flex="1" onClick={() => onClick(tarefa)}>
              <Text fontWeight="bold">{tarefa.titulo}</Text>
              {tarefa.dataEntrega && (
                <Text fontSize="xs" color="gray.500">
                  Entrega: {new Date(tarefa.dataEntrega).toLocaleDateString('pt-BR')}
                </Text>
              )}
            </Box>
          </Flex>
        </CardBody>
      </Card>
    </Box>
  );
};

export default function KanbanColumn({ coluna, tarefas, onAtualizarTitulo, onAdicionarTarefa, onDeletarColuna, isDefault, onOpenModal }) {
  const { setNodeRef } = useDroppable({ id: coluna.id });
  const bg = useColorModeValue('gray.100', 'gray.700');
  const [isEditing, setIsEditing] = useState(false);
  const [titulo, setTitulo] = useState(coluna.titulo);

  const handleTitleChange = () => {
    if (titulo.trim()) {
      onAtualizarTitulo(coluna.id, titulo);
      setIsEditing(false);
    }
  };

  return (
    <Box
      ref={setNodeRef}
      w={{ base: '100%', sm: '300px' }}
      minW={{ base: '100%', sm: '300px' }}
      maxW={{ base: '100%', sm: '300px' }}
      bg={bg}
      p={3}
      borderRadius="md"
      flexShrink={0}
    >
      <Flex justify="space-between" align="center" mb={3}>
        {isEditing ? (
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onBlur={handleTitleChange}
            onKeyPress={(e) => e.key === 'Enter' && handleTitleChange()}
            size="md"
            autoFocus
          />
        ) : (
          <Heading size="md" onClick={() => setIsEditing(true)} cursor="pointer">
            {coluna.titulo}
          </Heading>
        )}
        {!isDefault && (
          <IconButton
            icon={<FiTrash2 />}
            size="sm"
            colorScheme="red"
            variant="ghost"
            onClick={() => onDeletarColuna(coluna.id)}
            aria-label="Deletar coluna"
          />
        )}
      </Flex>
      <Button
        size="sm"
        colorScheme="teal"
        onClick={() => onAdicionarTarefa(coluna.id)}
        mb={3}
      >
        + Adicionar Tarefa
      </Button>
      <SortableContext items={tarefas.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <VStack spacing={3} align="stretch">
          {tarefas.length === 0 ? (
            <Text color="gray.500">Nenhum Item</Text>
          ) : (
            tarefas.map(tarefa => (
              <SortableItem
                key={tarefa.id}
                id={tarefa.id}
                tarefa={tarefa}
                onClick={onOpenModal}
              />
            ))
          )}
        </VStack>
      </SortableContext>
    </Box>
  );
}