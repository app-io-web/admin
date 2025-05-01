import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  useToast,
  Flex,
  useColorModeValue,
  useColorMode,
} from '@chakra-ui/react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

function DraggableItem({ id, title, type, data }) {
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.200');

  return (
    <Box
      p={3}
      bg={bgColor}
      borderRadius="md"
      mb={2}
      cursor="grab"
      _hover={{ bg: hoverBgColor }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ id, title, type, data }));
      }}
    >
      <Text fontSize="sm" fontWeight="medium">{title}</Text>
      <Text fontSize="xs" color={textColor}>{type === 'task' ? 'Tarefa' : 'Kanban Item'}</Text>
    </Box>
  );
}

function DroppableCalendar({ events, setEvents, toast, setTasks, setKanbanItems, unicID_user }) {
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const { colorMode } = useColorMode();

  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const customStyles = `
      .rbc-toolbar {
        padding: 8px 12px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
      }
      .rbc-toolbar button {
        border-radius: 6px;
        padding: 6px 12px;
        margin: 0 4px;
        transition: all 0.2s ease;
        color: ${colorMode === 'dark' ? '#e6f0ff' : '#1a73e8'};
        background-color: ${colorMode === 'dark' ? '#2D3748' : 'transparent'};
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: uppercase;
        border: none;
      }
      .rbc-toolbar button:hover {
        background-color: ${colorMode === 'dark' ? '#4A5568' : '#e6f0ff'};
        color: ${colorMode === 'dark' ? '#ffffff' : '#1a73e8'};
      }
      .rbc-toolbar button.rbc-active {
        background-color: ${colorMode === 'dark' ? '#1a73e8' : '#1a73e8'};
        color: white;
      }
      .rbc-toolbar-label {
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        color: ${colorMode === 'dark' ? '#E2E8F0' : 'inherit'};
      }
      .rbc-calendar {
        background-color: ${colorMode === 'dark' ? '#1A202C' : 'white'};
        color: ${colorMode === 'dark' ? '#E2E8F0' : 'inherit'};
        height: 100%;
        width: 100%;
      }
      .rbc-event {
        background-color: ${colorMode === 'dark' ? '#2B6CB0' : '#3182CE'};
        color: white;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 0.9rem;
        min-height: 24px;
        display: flex;
        align-items: center;
      }
      .rbc-event-label {
        color: white;
        font-size: 0.9rem;
      }
      .rbc-day-bg, .rbc-off-range-bg {
        background-color: ${colorMode === 'dark' ? '#2D3748' : '#F7FAFC'};
      }
      .rbc-today {
        background-color: ${colorMode === 'dark' ? '#4A5568' : '#EBF8FF'};
      }
      .rbc-header, .rbc-time-header {
        background-color: ${colorMode === 'dark' ? '#2D3748' : '#EDF2F7'};
        color: ${colorMode === 'dark' ? '#E2E8F0' : 'inherit'};
        padding: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        text-transform: uppercase;
      }
      .rbc-agenda-view table, .rbc-time-view, .rbc-month-view {
        color: ${colorMode === 'dark' ? '#E2E8F0' : 'inherit'};
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .rbc-month-row {
        flex: 1;
        min-height: 100px;
        display: flex;
        flex-direction: column;
      }
      .rbc-row-content {
        flex: 1;
      }
      .rbc-date-cell {
        padding: 8px;
        font-size: 0.9rem;
        text-align: center;
      }
      .rbc-date-cell.rbc-off-range {
        color: ${colorMode === 'dark' ? '#718096' : '#A0AEC0'};
      }
      .rbc-agenda-view {
        background-color: ${colorMode === 'dark' ? '#1A202C' : 'white'};
        color: ${colorMode === 'dark' ? '#E2E8F0' : 'inherit'};
      }
      .rbc-agenda-view table {
        width: 100%;
        border-collapse: collapse;
      }
      .rbc-agenda-view th {
        background-color: ${colorMode === 'dark' ? '#2D3748' : '#EDF2F7'};
        color: ${colorMode === 'dark' ? '#E2E8F0' : 'inherit'};
        padding: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        border-bottom: 1px solid ${colorMode === 'dark' ? '#4A5568' : '#E2E8F0'};
      }
      .rbc-agenda-view td {
        padding: 8px;
        font-size: 0.9rem;
        border-bottom: 1px solid ${colorMode === 'dark' ? '#4A5568' : '#E2E8F0'};
      }
      .rbc-agenda-date-cell, .rbc-agenda-time-cell {
        white-space: nowrap;
      }
      .rbc-agenda-event-cell {
        color: ${colorMode === 'dark' ? '#E2E8F0' : 'inherit'};
      }
      @media (max-width: 768px) {
        .rbc-agenda-view th, .rbc-agenda-view td {
          padding: 6px;
          font-size: 0.8rem;
        }
      }
    `;

    let styleSheet = document.getElementById('calendar-styles');
    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.id = 'calendar-styles';
      document.head.appendChild(styleSheet);
    }
    styleSheet.innerText = customStyles;
  }, [colorMode]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, slotInfo) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      await addEvent(data, slotInfo || { start: new Date(), end: new Date(Date.now() + 3600000) });
    } catch (error) {
      console.error('Erro ao processar drop:', error);
      toast({
        title: 'Erro ao adicionar evento',
        description: 'Não foi possível processar o item arrastado.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleSelectSlot = async (slotInfo) => {
    const draggedData = document.querySelector('.rbc-dragging')?.dataset?.item;
    if (draggedData) {
      try {
        const data = JSON.parse(draggedData);
        await addEvent(data, slotInfo);
      } catch (error) {
        console.error('Erro ao adicionar evento via select slot:', error);
      }
    }
  };

  const addEvent = async (data, slotInfo) => {
    const { id, title, type, data: itemData } = data;
    const startDateTime = new Date(slotInfo.start);
    const endDateTime = new Date(slotInfo.end || new Date(startDateTime.getTime() + 3600000));

    try {
      const response = await fetch('https://api.google.calendar.nexusnerds.com.br/google-calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unicID_user,
          title,
          description: `Origem: ${type === 'task' ? 'Tarefa' : 'Kanban'}\n${itemData.descricao || ''}`,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar evento');
      }

      const newEvent = await response.json();

      setEvents((prev) => [
        ...prev,
        {
          id: newEvent.id,
          title: newEvent.title,
          start: new Date(newEvent.start),
          end: new Date(newEvent.end),
          description: newEvent.description,
        },
      ]);

      if (type === 'task') {
        setTasks((prev) => prev.filter(task => task.id !== id));
      } else {
        setKanbanItems((prev) => prev.filter(item => item.id !== id));
      }

      toast({
        title: 'Evento adicionado ao calendário!',
        description: `Evento "${title}" criado com sucesso.`,
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      toast({
        title: 'Erro ao adicionar evento',
        description: error.message || 'Tente novamente.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const customDayHeader = ({ label }) => (
    <Box p={2} textAlign="center">
      <Text fontSize="sm" fontWeight="medium">{label}</Text>
    </Box>
  );

  const customDateCell = ({ children, value }) => {
    const isToday = moment(value).isSame(moment(), 'day');
    return (
      <Box
        p={2}
        textAlign="center"
        bg={isToday ? (colorMode === 'dark' ? '#4A5568' : '#EBF8FF') : 'transparent'}
        height="100%"
      >
        {children}
      </Box>
    );
  };

  const AgendaEvent = ({ event }) => {
    const start = moment(event.start);
    const end = moment(event.end);
    const duration = end.diff(start, 'minutes');
    const timeFormat = duration >= 24 * 60 ? 'h:mm a' : 'h:mm a';
    const timeString = `${start.format(timeFormat)} - ${end.format(timeFormat)}`;

    return (
      <Box className="rbc-agenda-event-cell">
        <Text>{event.title}</Text>
        {event.description && (
          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            {event.description}
          </Text>
        )}
      </Box>
    );
  };

  return (
    <Box
      height={{ base: '600px', md: '700px' }}
      border="2px dashed"
      borderColor={borderColor}
      borderRadius="lg"
      p={{ base: 2, md: 4 }}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e)}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        onSelectEvent={(event) => toast({
          title: event.title,
          description: event.description || 'Sem descrição.',
          status: 'info',
          duration: 3000,
        })}
        selectable
        onSelectSlot={handleSelectSlot}
        components={{
          day: { header: customDayHeader },
          dateCellWrapper: customDateCell,
          agenda: { event: AgendaEvent },
        }}
        messages={{
          month: 'Mês',
          week: 'Semana',
          day: 'Dia',
          agenda: 'Agenda',
          today: 'Hoje',
          previous: 'Anterior',
          next: 'Próximo',
          date: 'Data',
          time: 'Hora',
          event: 'Evento',
          noEventsInRange: 'Nenhum evento neste período.',
        }}
      />
    </Box>
  );
}

export default function TasksAndKanbanPage() {
  const [tasks, setTasks] = useState([]);
  const [kanbanItems, setKanbanItems] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.900');

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario?.idUnico || 'user_123';

  const fetchTasks = async () => {
    try {
      const response = await fetch(`https://api.kanban.nexusnerds.com.br/todos/${unicID_user}`);
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      const allTasks = (data.tarefas || []).filter(tarefa => !tarefa.kanban);
      const filteredTasks = allTasks.filter(task => {
        return !calendarEvents.some(event => 
          event.title === task.titulo && 
          event.description?.includes('Origem: Tarefa')
        );
      });
      setTasks(filteredTasks);
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
      toast({
        title: '❌ Erro ao carregar tarefas',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchKanbanItems = async () => {
    try {
      const response = await fetch(`https://api.kanban.nexusnerds.com.br/kanban/boards/${unicID_user}`);
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }
      const boards = await response.json();
      const allTasks = [];
      for (const board of boards) {
        const boardResponse = await fetch(`https://api.kanban.nexusnerds.com.br/kanban/boards/${unicID_user}/${board.board_id}`);
        if (!boardResponse.ok) {
          throw new Error(`Erro na requisição do board ${board.board_id}: ${boardResponse.status} ${boardResponse.statusText}`);
        }
        const boardData = await boardResponse.json();
        allTasks.push(...(boardData.tasks || []).map(task => ({ ...task, boardName: board.name })));
      }
      const filteredKanbanItems = allTasks.filter(item => {
        return !calendarEvents.some(event => 
          event.title === `${item.titulo} (Board: ${item.boardName})` && 
          event.description?.includes('Origem: Kanban')
        );
      });
      setKanbanItems(filteredKanbanItems);
    } catch (err) {
      console.error('Erro ao carregar itens do Kanban:', err);
      toast({
        title: '❌ Erro ao carregar itens do Kanban',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
      setKanbanItems([]);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      const response = await fetch(
        `https://api.google.calendar.nexusnerds.com.br/google-calendar/events/${unicID_user}?timeMin=${timeMin}&timeMax=${timeMax}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar eventos');
      }
      const calendarEvents = await response.json();
      setCalendarEvents(
        calendarEvents.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start),
          end: new Date(event.end),
          description: event.description,
        }))
      );
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: 'Erro ao buscar eventos',
        description: error.message || 'Tente novamente.',
        status: 'error',
        duration: 5000,
      });
      setCalendarEvents([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchCalendarEvents();
    };
    loadData();
  }, [unicID_user]);

  useEffect(() => {
    fetchTasks();
    fetchKanbanItems();
  }, [calendarEvents, unicID_user]);

  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box display="flex" minH="100vh" bg={bgColor}>
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
        px={{ base: 4, md: 8 }}
        pt={{ base: 4, md: 6 }}
        pb={{ base: 24, md: 6 }}
        minH="100vh"
        overflowX="hidden"
        overflowY="auto"
      >
        <Heading size="lg" mb={6}>Tarefas e Kanban para Agenda</Heading>
        <Flex direction={{ base: 'column', lg: 'row' }} gap={6}>
          <VStack flex="1" align="stretch" spacing={6} maxW={{ lg: '400px' }}>
            <Box>
              <Heading size="md" mb={3}>Tarefas</Heading>
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <DraggableItem
                    key={task.id}
                    id={task.id}
                    title={task.titulo}
                    type="task"
                    data={task}
                  />
                ))
              ) : (
                <Text color={textColor}>Nenhuma tarefa encontrada.</Text>
              )}
            </Box>
            <Box>
              <Heading size="md" mb={3}>Itens do Kanban</Heading>
              {kanbanItems.length > 0 ? (
                kanbanItems.map(item => (
                  <DraggableItem
                    key={item.id}
                    id={item.id}
                    title={`${item.titulo} (Board: ${item.boardName})`}
                    type="kanban"
                    data={item}
                  />
                ))
              ) : (
                <Text color={textColor}>Nenhum item de Kanban encontrado.</Text>
              )}
            </Box>
          </VStack>
          <Box flex="2">
            <Heading size="md" mb={3}>Solte aqui para adicionar ao Calendário</Heading>
            <DroppableCalendar
              events={calendarEvents}
              setEvents={setCalendarEvents}
              toast={toast}
              setTasks={setTasks}
              setKanbanItems={setKanbanItems}
              unicID_user={unicID_user}
            />
          </Box>
        </Flex>
      </Box>
      <BottomBar />
    </Box>
  );
}