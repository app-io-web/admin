// src/components/layout/subcomponents/MenuAvancado.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VStack, Button, Collapse, useDisclosure, Spinner, Box, Text } from '@chakra-ui/react';
import { usePermissions } from '../../../context/PermissionsContext';
import PropTypes from 'prop-types';

export default function MenuAvancado({ isCollapsed, isActive, search }) {
  const { isOpen, onToggle } = useDisclosure();
  const { hasPermission, isLoading, error, refreshPermissions } = usePermissions();

  const items = [
    { label: 'Integração Calendario', path: '/avancado/google-integration', permission: 'PERM-[AVANÇADO-A.N1-INTEGRAÇÃO-GOOGLE-CALENDARIO]' },
    { label: 'Consulta Vir Telecom', path: '/avancado/consultavir', permission: 'PERM-[ADMIN-CONSULTA-VIR-TELECOM]' },
  ];

  const configSiteItems = [
    { label: 'Banners Empresarial', path: '/admin/avancado/config-site/empresarialbanners', permission: 'PERM-[AVANÇADO-A.N1-BANNER-EMPRESARIAL]' },
    { label: 'Banners Principal', path: '/admin/avancado/config-site/principalbanners', permission: 'PERM-[AVANÇADO-A.N1-BANNER-PRINCIPAL]' },
    { label: 'Frase Dinâmica', path: '/admin/avancado/config-site/dinamicsfrase', permission: 'PERM-[AVANÇADO-A.N1-FRASES-DINAMICAS]' },
    { label: 'Planos Empresariais', path: '/admin/avancado/config-site/planosempresariais', permission: 'PERM-[AVANÇADO-A.N1-PLANOS-EMPRESARIAL]' },
    { label: 'Planos Serviço Adicional', path: '/admin/avancado/config-site/planos-servico-adicional-page', permission: 'PERM-[AVANÇADO-A.N1-SERVICOS-ADICIONAIS]' },
    { label: 'Dúvidas Frequentes', path: '/admin/avancado/config-site/duvidasfrequente', permission: 'PERM-[AVANÇADO-A.N1-DUVIDAS-FREQUENTE]' },
    { label: 'Campos Gerais', path: '/admin/avancado/config-site/configuracoes-gerais', permission: 'PERM-[AVANÇADO-A.N1-CAMPOS-GERAIS]' },
    { label: 'Serviços Planos', path: '/admin/avancado/config-site/configuracoes-servicos', permission: 'PERM-[AVANÇADO-A.N1-SERVICOSPLANOS]' },
    { label: 'Vendedores', path: '/admin/avancado/config-site/vendedores', permission: 'PERM-[AVANÇADO-A.N1-VENDEDORES]' },
    { label: 'Cupom Desconto', path: '/admin/avancado/config-site/cupom-desconto', permission: 'PERM-[AVANÇADO-A.N1-CUPOMDESCONTO]' },
  ];

  // Configurar polling para atualizar permissões a cada 10 segundo

  // Filtrar itens com base nas permissões e na busca
  const filteredItems = items
    .filter(item => hasPermission(item.permission))
    .filter(item => item.label.toLowerCase().includes(search.toLowerCase().trim()));

  const filteredConfigSiteItems = configSiteItems
    .filter(item => hasPermission(item.permission))
    .filter(item => item.label.toLowerCase().includes(search.toLowerCase().trim()));

  console.log('Itens filtrados (items):', filteredItems);
  console.log('Itens filtrados (configSiteItems):', filteredConfigSiteItems);

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
        filteredItems.map(item => (
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

      <Button
        variant="ghost"
        justifyContent={isCollapsed ? 'center' : 'flex-start'}
        colorScheme="gray"
        onClick={onToggle}
      >
        {!isCollapsed && 'Configurações Site'}
      </Button>

      <Collapse in={isOpen}>
        <VStack align="stretch" ml={4}>
          {filteredConfigSiteItems.length > 0 ? (
            filteredConfigSiteItems.map(item => (
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
            <Text>Nenhum item de configuração disponível para suas permissões ou busca</Text>
          )}
        </VStack>
      </Collapse>
    </VStack>
  );
}

MenuAvancado.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  isActive: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
};