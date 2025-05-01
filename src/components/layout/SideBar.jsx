import { useState, useEffect } from 'react';
import { Box, IconButton, VStack, HStack, Input, useColorModeValue, useColorMode } from '@chakra-ui/react';
import { FiMenu, FiPrinter, FiSettings, FiHome, FiChevronLeft, FiChevronRight, FiCheckSquare, FiSun, FiMoon } from 'react-icons/fi';
import MenuPrincipal from './subcomponents/MenuPrincipal';
import MenuCadastros from './subcomponents/MenuCadastros';
import MenuRelatorios from './subcomponents/MenuRelatorios';
import MenuAvancado from './subcomponents/MenuAvancado';
import MenuTarefas from './subcomponents/MenuTarefas';
import { useLocation } from 'react-router-dom';

export default function Sidebar() {
  const [activeMenu, setActiveMenu] = useState('principal');
  const [isCollapsed, setIsCollapsed] = useState(true); // Inicia colapsado
  const [search, setSearch] = useState('');
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const bg = useColorModeValue('gray.50', 'gray.800');

  const isActive = (path) => location.pathname.startsWith(path);

  // Controla o estado colapsado com base na rota
  useEffect(() => {
    if (location.pathname === '/admin/chat') {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [location.pathname]);

  // Atualiza activeMenu com base na rota atual
  useEffect(() => {
    const path = location.pathname;
    if (
      path.startsWith('/tarefas') ||
      path.startsWith('/kanban') ||
      path.startsWith('/tasks-and-kanban') ||
      path.startsWith('/calendar') ||
      path.startsWith('/google-integration') ||
      path.startsWith('/notas')
    ) {
      setActiveMenu('tarefas');
    } else if (path.startsWith('/relatorios')) {
      setActiveMenu('relatorios');
    } else if (path.startsWith('/cadastros')) {
      setActiveMenu('cadastros');
    } else if (path.startsWith('/avancado') || path.startsWith('/admin/avancado')) {
      setActiveMenu('avancado');
    } else {
      setActiveMenu('principal');
    }
  }, [location.pathname, setActiveMenu]);

  return (
    <Box
      bg={bg}
      minH="100vh"
      p={2}
      w={isCollapsed ? '80px' : '250px'}
      transition="width 0.3s"
      display={{ base: 'none', md: 'flex' }}
      flexDirection="column"
      justifyContent="space-between"
    >
      {!isCollapsed && (
        <HStack justify="space-between" p={2}>
          <Input
            placeholder="Pesquisar..."
            size="sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <IconButton
            icon={<FiChevronLeft />}
            aria-label="Recolher menu"
            size="sm"
            onClick={() => setIsCollapsed(true)}
          />
        </HStack>
      )}
      {isCollapsed && (
        <Box textAlign="center">
          <IconButton
            icon={<FiChevronRight />}
            aria-label="Expandir menu"
            size="sm"
            onClick={() => setIsCollapsed(false)}
          />
        </Box>
      )}

      {isCollapsed ? (
        <VStack spacing={4} mt={4}>
          <IconButton
            icon={<FiHome />}
            aria-label="Principal"
            variant={activeMenu === 'principal' ? 'solid' : 'ghost'}
            onClick={() => setActiveMenu('principal')}
          />
          <IconButton
            icon={<FiMenu />}
            aria-label="Cadastros"
            variant={activeMenu === 'cadastros' ? 'solid' : 'ghost'}
            onClick={() => setActiveMenu('cadastros')}
          />
          <IconButton
            icon={<FiPrinter />}
            aria-label="Relatórios"
            variant={activeMenu === 'relatorios' ? 'solid' : 'ghost'}
            onClick={() => setActiveMenu('relatorios')}
          />
          <IconButton
            icon={<FiSettings />}
            aria-label="Avançado"
            variant={activeMenu === 'avancado' ? 'solid' : 'ghost'}
            onClick={() => setActiveMenu('avancado')}
          />
          <IconButton
            icon={<FiCheckSquare />}
            aria-label="Tarefas"
            variant={activeMenu === 'tarefas' ? 'solid' : 'ghost'}
            onClick={() => setActiveMenu('tarefas')}
          />
        </VStack>
      ) : (
        <HStack spacing={2} justify="center" mt={2}>
          <IconButton
            icon={<FiHome />}
            aria-label="Principal"
            variant={activeMenu === 'principal' ? 'solid' : 'ghost'}
            onClick={() => setActiveMenu('principal')}
          />
          <IconButton
            icon={<FiMenu />}
            aria-label="Cadastros"
            variant={activeMenu === 'cadastros' ? 'solid' : 'ghost'}
            onClick={() => setActiveMenu('cadastros')}
          />
          <IconButton
            icon={<FiPrinter />}
            aria-label="Relatórios"
            variant={activeMenu === 'relatorios' ? 'solid' : 'ghost'}
            onClick={() => setActiveMenu('relatorios')}
          />
          <IconButton
            icon={<FiSettings />}
            aria-label="Avançado"
            variant={activeMenu === 'avancado' ? 'solid' : 'ghost'}
            onClick={() => setActiveMenu('avancado')}
          />
          <IconButton
            icon={<FiCheckSquare />}
            aria-label="Tarefas"
            variant={activeMenu === 'tarefas' ? 'solid' : 'ghost'}
            onClick={() => setActiveMenu('tarefas')}
          />
        </HStack>
      )}

      {!isCollapsed && (
        <Box mt={4} flex="1">
          {activeMenu === 'principal' && <MenuPrincipal isCollapsed={isCollapsed} isActive={isActive} search={search} />}
          {activeMenu === 'cadastros' && <MenuCadastros isCollapsed={isCollapsed} isActive={isActive} search={search} />}
          {activeMenu === 'relatorios' && <MenuRelatorios isCollapsed={isCollapsed} isActive={isActive} search={search} />}
          {activeMenu === 'avancado' && <MenuAvancado isCollapsed={isCollapsed} isActive={isActive} search={search} />}
          {activeMenu === 'tarefas' && <MenuTarefas isCollapsed={isCollapsed} isActive={isActive} search={search} />}
        </Box>
      )}

      <Box mt="auto" pt={8} pb={4}>
        <HStack justifyContent={isCollapsed ? 'center' : 'flex-start'} spacing={isCollapsed ? 0 : 2}>
          {isCollapsed ? (
            <IconButton
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              aria-label="Alternar tema"
              variant="ghost"
              onClick={toggleColorMode}
            />
          ) : (
            <>
              <FiSun />
              <Box as="label" display="flex" alignItems="center" cursor="pointer">
                <input
                  type="checkbox"
                  onChange={toggleColorMode}
                  checked={colorMode === 'dark'}
                  style={{ display: 'none' }}
                />
                <Box
                  w="30px"
                  h="16px"
                  bg={colorMode === 'light' ? 'gray.300' : 'gray.600'}
                  borderRadius="999px"
                  position="relative"
                  transition="all 0.3s ease-in-out"
                >
                  <Box
                    w="12px"
                    h="12px"
                    bg="white"
                    borderRadius="full"
                    position="absolute"
                    top="2px"
                    left={colorMode === 'light' ? '2px' : '16px'}
                    transition="all 0.3s ease-in-out"
                  />
                </Box>
              </Box>
              <FiMoon />
            </>
          )}
        </HStack>
      </Box>
    </Box>
  );
}