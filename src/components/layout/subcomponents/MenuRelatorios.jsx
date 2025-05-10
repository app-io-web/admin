import { Link } from 'react-router-dom';
import { VStack, Button, Text, Spinner, Box } from '@chakra-ui/react';
import { usePermissions } from '../../../context/PermissionsContext';
import PropTypes from 'prop-types';

export default function MenuRelatorios({ isCollapsed, isActive, search }) {
  const { hasPermission, isLoading, error } = usePermissions();

  const sections = [
    {
      label: 'Ativações',
      submenu: [
        {
          label: 'Relatórios de Ativados',
          path: '/relatorios/Ativados',
          permission: 'PERM-[ADMIN-RELATORIO-ATIVADOS]',
        },
        {
          label: 'Relatórios de bloqueados',
          path: '/relatorios/bloqueados',
          permission: 'PERM-[ADMIN-RELATORIO-BLOQUEADOS]',
        },
      ],
    },
    {
      label: 'Fechamento Diário',
      submenu: [
        {
          label: 'Histórico de Fechamento',
          path: '/relatorios/reis/historico-fechamento',
          permission: 'PERM-[ADMIN-RELATORIO-FECHAMENTO-HISTORICO]', // Nenhuma permissão específica para este item (ajustar se necessário)
        },
      ],
    },
    {
      label: 'Relatório Técnico',
      submenu: [
        {
          label: 'Relatório de ONU/ONT Offline',
          path: '/relatorios/monitoramento/onus',
          permission: 'PERM-[ADMIN-RELATORIO-ONU-HISTORICO]', // Nenhuma permissão específica para este item (ajustar se necessário)
        },
      ],
    }
  ];

  // Filtra seções e submenus com base nas permissões e na busca
  const filteredSections = sections
    .map((section) => {
      const filteredSubmenu = section.submenu
        .filter((item) => !item.permission || hasPermission(item.permission)) // Exibe itens sem permissão ou com permissão válida
        .filter((item) => item.label.toLowerCase().includes(search.toLowerCase().trim()));

      return filteredSubmenu.length > 0 ? { ...section, submenu: filteredSubmenu } : null;
    })
    .filter((section) => section !== null);

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
    <VStack align="stretch" spacing={4}>
      {filteredSections.length > 0 ? (
        filteredSections.map((section) => (
          <VStack key={section.label} align="stretch" spacing={1}>
            {!isCollapsed && (
              <Text fontSize="sm" fontWeight="bold" color="gray.500" pl={2}>
                {section.label}
              </Text>
            )}
            {section.submenu.map((item) => (
              <Link to={item.path} key={item.path}>
                <Button
                  variant="ghost"
                  justifyContent={isCollapsed ? 'center' : 'flex-start'}
                  colorScheme={isActive(item.path) ? 'blue' : 'gray'}
                  size="sm"
                >
                  {!isCollapsed && item.label}
                </Button>
              </Link>
            ))}
          </VStack>
        ))
      ) : (
        <Text>Nenhum item disponível para suas permissões ou busca</Text>
      )}
    </VStack>
  );
}

MenuRelatorios.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  isActive: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
};