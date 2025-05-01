import { Link } from 'react-router-dom';
import { VStack, Button, Tooltip, Collapse, Box, Spinner, Text } from '@chakra-ui/react';
import { FiHome, FiBookmark, FiDollarSign } from 'react-icons/fi';
import { useState } from 'react';
import { usePermissions } from '../../../context/PermissionsContext';
import PropTypes from 'prop-types';

export default function MenuPrincipal({ isCollapsed, isActive, search }) {
  const [atalhosAberto, setAtalhosAberto] = useState(false); // Estado para o submenu de Atalhos
  const [cobrancaAberto, setCobrancaAberto] = useState(false); // Estado para o submenu de Cobrança
  const { hasPermission, isLoading, error } = usePermissions();

  const items = [
    {
      label: 'Dashboard',
      path: '/',
      icon: <FiHome />,
      permission: 'PERM-[ADMIN-DASBOARD]',
    },
    {
      label: 'Atalhos',
      path: '/atalhos',
      icon: <FiBookmark />,
      submenu: [
        { label: '- Atalhos Principais', path: '/atalhos', permission: null },
        { label: '- Atalhos Pessoais', path: '/atalhos/pessoais', permission: null },
      ],
    },
    {
      label: 'Cobrança',
      path: '/cobranca',
      icon: <FiDollarSign />,
      submenu: [
        {
          label: 'Clientes Bloqueados',
          path: '/cobranca',
          permission: 'PERM-[FINANCEIRO-CLIENTES-BLOQUEADOS]',
        },
        {
          label: 'Configuração de Cobrança',
          path: '/cobranca/config',
          permission: 'PERM-[FINANCEIRO-CFG-COBRANÇA]',
        },
      ],
    },
  ];

  // Filtra itens com base nas permissões e na busca
  const filteredItems = items
    .filter((item) => !item.permission || hasPermission(item.permission))
    .filter(
      (item) =>
        item.label.toLowerCase().includes(search.toLowerCase().trim()) ||
        (item.submenu &&
          item.submenu.some((sub) =>
            sub.label.toLowerCase().includes(search.toLowerCase().trim())
          ))
    )
    .map((item) => {
      if (item.submenu) {
        const submenuFiltered = item.submenu
          .filter((sub) => !sub.permission || hasPermission(sub.permission))
          .filter((sub) => sub.label.toLowerCase().includes(search.toLowerCase().trim()));
        return { ...item, submenu: submenuFiltered };
      }
      return item;
    })
    .filter((item) => !item.submenu || item.submenu.length > 0);

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
        filteredItems.map((item) => {
          if (item.submenu) {
            const isSubmenuOpen =
              item.label === 'Atalhos'
                ? atalhosAberto || isActive(item.path)
                : cobrancaAberto || isActive(item.path);

            return (
              <Tooltip
                label={item.label}
                placement="right"
                isDisabled={!isCollapsed}
                key={item.path}
              >
                <Box>
                  <Button
                    variant="ghost"
                    w="full"
                    justifyContent={isCollapsed ? 'center' : 'flex-start'}
                    leftIcon={item.icon}
                    onClick={() =>
                      item.label === 'Atalhos'
                        ? setAtalhosAberto(!atalhosAberto)
                        : setCobrancaAberto(!cobrancaAberto)
                    }
                    colorScheme={isActive(item.path) ? 'blue' : 'gray'}
                  >
                    {!isCollapsed && item.label}
                  </Button>

                  <Collapse in={isSubmenuOpen}>
                    <VStack align="stretch" pl={isCollapsed ? 0 : 8} mt={2} spacing={1}>
                      {item.submenu.map((sub) => (
                        <Link to={sub.path} key={sub.path}>
                          <Button
                            variant="ghost"
                            size="sm"
                            w="full"
                            justifyContent={isCollapsed ? 'center' : 'flex-start'}
                            colorScheme={isActive(sub.path) ? 'blue' : 'gray'}
                          >
                            {!isCollapsed && sub.label}
                          </Button>
                        </Link>
                      ))}
                    </VStack>
                  </Collapse>
                </Box>
              </Tooltip>
            );
          } else {
            return (
              <Link to={item.path} key={item.path}>
                <Tooltip label={item.label} placement="right" isDisabled={!isCollapsed}>
                  <Button
                    variant="ghost"
                    w="full"
                    justifyContent={isCollapsed ? 'center' : 'flex-start'}
                    leftIcon={item.icon}
                    colorScheme={isActive(item.path) ? 'blue' : 'gray'}
                  >
                    {!isCollapsed && item.label}
                  </Button>
                </Tooltip>
              </Link>
            );
          }
        })
      ) : (
        <Text>Nenhum item disponível para suas permissões ou busca</Text>
      )}
    </VStack>
  );
}

MenuPrincipal.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  isActive: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
};