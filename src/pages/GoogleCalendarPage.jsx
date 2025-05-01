import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  useToast,
  Button,
  VStack,
  Icon,
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Text,
  IconButton
} from '@chakra-ui/react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br'; // Importa o locale para português brasileiro
import 'react-big-calendar/lib/css/react-big-calendar.css';
import SideBar from '../components/layout/SideBar';
import BottomBar from '../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../components/layout/PerfilUsuarioDesktop';
import { RepeatIcon, DeleteIcon } from '@chakra-ui/icons'; // Adicionado DeleteIcon

// Configura o locale do moment para pt-br
moment.locale('pt-br');

// Cria o localizer com o moment configurado
const localizer = momentLocalizer(moment);

export default function GoogleCalendarPage() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month'); // Estado para controlar a visualização (mês, semana, etc.)
  const [date, setDate] = useState(new Date()); // Estado para controlar a data atual exibida
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar o modal
  const [selectedEvent, setSelectedEvent] = useState(null); // Estado para o evento selecionado
  const [editedEvent, setEditedEvent] = useState({}); // Estado para o evento editado
  const toast = useToast();
  const { colorMode } = useColorMode(); // Hook para obter o modo de cor atual

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario?.idUnico || 'user_123';

  const fetchEvents = async () => {
    try {
      // Calcular o intervalo de datas com base na visualização e na data atual do calendário
      let timeMin, timeMax;
      const currentDate = moment(date);

      if (view === 'month') {
        timeMin = currentDate.clone().startOf('month').startOf('day');
        timeMax = currentDate.clone().endOf('month').endOf('day');
      } else if (view === 'week') {
        timeMin = currentDate.clone().startOf('week').startOf('day');
        timeMax = currentDate.clone().endOf('week').endOf('day');
      } else if (view === 'day') {
        timeMin = currentDate.clone().startOf('day');
        timeMax = currentDate.clone().endOf('day');
      } else if (view === 'agenda') {
        // Agenda geralmente mostra 30 dias a partir da data atual
        timeMin = currentDate.clone().startOf('day');
        timeMax = currentDate.clone().add(30, 'days').endOf('day');
      }

      const response = await fetch(
        `https://api.google.calendar.nexusnerds.com.br/google-calendar/events/${unicID_user}?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar eventos');
      }
      const calendarEvents = await response.json();
      setEvents(
        calendarEvents.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }))
      );
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: 'Erro ao buscar eventos',
        description: error.message.includes('Refresh token não configurado')
          ? 'O refresh token não está configurado. Por favor, reconfigure o token na página de integração.'
          : error.message || 'Tente novamente.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Atualiza os eventos a cada 20 segundos e quando a data ou visualização mudar
  useEffect(() => {
    fetchEvents(); // Chama inicialmente ao montar o componente

    const intervalId = setInterval(() => {
      fetchEvents();
    }, 20000); // 20 segundos

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(intervalId);
  }, [date, view]); // Dependências: date e view

  // Função para lidar com a mudança de visualização (Mês, Semana, Dia, Agenda)
  const handleViewChange = (newView) => {
    setView(newView);
  };

  // Função para lidar com a navegação (Anterior, Próximo, Hoje)
  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  // Função para abrir o modal ao clicar em um evento
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setEditedEvent({
      title: event.title,
      description: event.description || '',
      start: moment(event.start).format('YYYY-MM-DDTHH:mm'),
      end: moment(event.end).format('YYYY-MM-DDTHH:mm'),
    });
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setEditedEvent({});
  };

  // Função para lidar com mudanças nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedEvent((prev) => ({ ...prev, [name]: value }));
  };

  // Função para salvar as alterações do evento
  const handleSaveEvent = async () => {
    try {
      const updatedEvent = {
        unicID_user,
        title: editedEvent.title,
        description: editedEvent.description,
        startDateTime: editedEvent.start,
        endDateTime: editedEvent.end,
      };

      // Envia a requisição para atualizar o evento no backend usando PATCH
      const response = await fetch(`https://api.google.calendar.nexusnerds.com.br/google-calendar/events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar evento');
      }

      toast({
        title: 'Evento atualizado com sucesso!',
        status: 'success',
        duration: 3000,
      });

      // Fecha o modal e atualiza os eventos
      handleCloseModal();
      fetchEvents();
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: 'Erro ao atualizar evento',
        description: error.message || 'Tente novamente.',
        status: 'error',
        duration: 5000,
      });
    }
  };


  const handleDeleteEvent = async () => {
    try {
      const response = await fetch(`https://api.google.calendar.nexusnerds.com.br/google-calendar/events/${selectedEvent.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unicID_user }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar evento');
      }

      toast({
        title: 'Evento deletado com sucesso!',
        status: 'success',
        duration: 3000,
      });

      // Fecha o modal e atualiza os eventos
      handleCloseModal();
      fetchEvents();
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      toast({
        title: 'Erro ao deletar evento',
        description: error.message || 'Tente novamente.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Estilo personalizado para a toolbar e o calendário, adaptado para o modo escuro
  const customStyles = `
    .rbc-toolbar button {
      border-radius: 8px;
      padding: 6px 12px;
      margin: 0 4px;
      transition: all 0.2s ease;
      color: ${colorMode === 'dark' ? '#e6f0ff' : '#1a73e8'};
      background-color: ${colorMode === 'dark' ? '#2D3748' : 'transparent'};
    }
    .rbc-toolbar button:hover {
      background-color: ${colorMode === 'dark' ? '#4A5568' : '#e6f0ff'};
      color: ${colorMode === 'dark' ? '#ffffff' : '#1a73e8'};
    }
    .rbc-toolbar button.rbc-active {
      background-color: ${colorMode === 'dark' ? '#1a73e8' : '#1a73e8'};
      color: white;
    }
    .rbc-calendar {
      background-color: ${colorMode === 'dark' ? '#1A202C' : 'white'};
      color: ${colorMode === 'dark' ? '#E2E8F0' : 'inherit'};
    }
    .rbc-event {
      background-color: ${colorMode === 'dark' ? '#2B6CB0' : '#3182CE'};
      color: white;
    }
    .rbc-event-label {
      color: white;
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
    }
    .rbc-agenda-view table, .rbc-time-view, .rbc-month-view {
      color: ${colorMode === 'dark' ? '#E2E8F0' : 'inherit'};
    }
  `;

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
        pt={{ base: 4, md: 6 }}
        pb={{ base: 24, md: 6 }}
        minH="100vh"
        overflowX="hidden"
        overflowY="auto"
      >
        <Heading fontSize={{ base: 'xl', md: '2xl' }} mb={6}>
          Meu Calendário
        </Heading>

        <VStack spacing={4} align="stretch">
          <Box
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="md"
            bg={colorMode === 'dark' ? 'gray.800' : 'white'}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Heading size="md">Eventos do Google Calendar</Heading>
              <Button
                colorScheme="blue"
                size="sm"
                leftIcon={<Icon as={RepeatIcon} />}
                onClick={fetchEvents}
              >
                Atualizar Eventos
              </Button>
            </Box>
            <Box height={{ base: '500px', md: '600px' }}>
              <style>{customStyles}</style>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={handleSelectEvent}
                views={['month', 'week', 'day', 'agenda']}
                view={view}
                onView={handleViewChange}
                date={date}
                onNavigate={handleNavigate}
                toolbar={true}
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
          </Box>
        </VStack>
      </Box>

      <BottomBar />

      {/* Modal para editar o evento */}
      {selectedEvent && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Editar Evento</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Título</FormLabel>
                  <Input
                    name="title"
                    value={editedEvent.title || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Descrição</FormLabel>
                  <Textarea
                    name="description"
                    value={editedEvent.description || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Início</FormLabel>
                  <Input
                    type="datetime-local"
                    name="start"
                    value={editedEvent.start || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Fim</FormLabel>
                  <Input
                    type="datetime-local"
                    name="end"
                    value={editedEvent.end || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Origem</FormLabel>
                  <Text>Tarefa</Text>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
            <IconButton
                aria-label="Deletar evento"
                icon={<DeleteIcon />}
                colorScheme="red"
                variant="ghost"
                onClick={handleDeleteEvent}
                mr={3}
              />
              <Button colorScheme="blue" mr={3} onClick={handleSaveEvent}>
                Salvar
              </Button>
              <Button variant="ghost" onClick={handleCloseModal}>
                Cancelar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}