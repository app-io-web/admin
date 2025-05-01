import { Link } from 'react-router-dom';
import { VStack, Button, Text, Spinner, Box } from '@chakra-ui/react';
import { usePermissions } from '../../../context/PermissionsContext';
import PropTypes from 'prop-types';

export default function MenuCadastros({ isCollapsed, isActive, search }) {
  const { hasPermission, isLoading, error } = usePermissions();

  const items = [
    {
      label: 'Criar Usuário',
      path: '/admin/createuser',
      permission: 'PERM-[ADMIN-CREATE-USER]',
    },
  ];

  // Filtra itens com base nas permissões e na busca
  const filteredItems = items
    .filter((item) => !item.permission || hasPermission(item.permission))
    .filter((item) => item.label.toLowerCase().includes(search.toLowerCase().trim()));

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
    <VStack align="stretch">
      {filteredItems.length > 0 ? (
        filteredItems.map((item) => (
          <Link to={item.path} key={item.path}>
            <Button
              variant="ghost"
              justifyContent={isCollapsed ? 'center' : 'flex-start'}
              colorScheme={isActive(item.path) ? 'blue' : 'gray'}
            >
              {!isCollapsed && item.label}
            </Button>
          </Link>
        ))
      ) : (
        <Text>Nenhum item disponível para suas permissões ou busca</Text>
      )}
    </VStack>
  );
}

MenuCadastros.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  isActive: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
};