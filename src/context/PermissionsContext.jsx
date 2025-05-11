// src/context/PermissionsContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchUserPermissions } from '../services/permissionsService';

// Lista de permissões (para inicializar o estado)
const PERMISSIONS_LIST = [
  'PERM-[FINANCEIRO-TOTAL]',
  'PERM-[FINANCEIRO-CLIENTES-BLOQUEADOS]',
  'PERM-[FINANCEIRO-CFG-COBRANÇA]',
  'PERM-[ADMIN-TOTAL]',
  'PERM-[ADMIN-ACESSO-PERMISSOES]',
  'PERM-[ADMIN-CREATE-USER]',
  'PERM-[ADMIN-CONSULTA-VIR-TELECOM]',
  'PERM-[ADMIN-RELATORIO-BLOQUEADOS]',
  'PERM-[ADMIN-RELATORIO-ATIVADOS]',
  'PERM-[ADMIN-RELATORIO-FECHAMENTO-HISTORICO]',
  'PERM-[ADMIN-DASBOARD]',
  'PERM-[ADMIN-CONFIG]',
  'PERM-[ADMIN-ATALHOS]',
  'PERM-[ADMIN-ATALHOS-PESSOAIS]',
  'PERM-[AVANÇADO-A.N1-TOTAL]',
  'PERM-[AVANÇADO-A.N1-PLANOS-EMPRESARIAL]',
  'PERM-[AVANÇADO-A.N1-SERVICOSPLANOS]',
  'PERM-[AVANÇADO-A.N1-VENDEDORES]',
  'PERM-[AVANÇADO-A.N1-CUPOMDESCONTO]',
  'PERM-[AVANÇADO-A.N1-DUVIDAS-FREQUENTE]',
  'PERM-[AVANÇADO-A.N1-FRASES-DINAMICAS]',
  'PERM-[AVANÇADO-A.N1-SERVICOS-ADICIONAIS]',
  'PERM-[AVANÇADO-A.N1-BANNER-PRINCIPAL]',
  'PERM-[AVANÇADO-A.N1-BANNER-EMPRESARIAL]',
  'PERM-[AVANÇADO-A.N1-INTEGRAÇÃO-GOOGLE-CALENDARIO]',
  'PERM-[AVANÇADO-A.N1-CAMPOS-GERAIS]',
  'PERM-[AVANÇADO-A.N1-BANNER-EMPRESARIAL]',
  'PERM-[AVANÇADO-A.N1-BANNER-PRINCIPAL]',
  'PERM-[ADMIN-FRASES-DINAMICAS]',
  'PERM-[AVANÇADO-A.N1-BANNER-EMPRESARIAL]',
  'PERM-[AVANÇADO-A.N1-SERVICOS-ADICIONAIS]',
  'PERM-[AVANÇADO-A.N1-DUVIDAS-FREQUENTE]',
  'PERM-[AVANÇADO-A.N1-SERVICOSPLANOS]',
  'PERM-[AVANÇADO-A.N1-VENDEDORES]',
  'PERM-[AVANÇADO-A.N1-CUPOMDESCONTO]',
  'PERM-[USER-A.N0-MINHAS-TAREFAS]',
  'PERM-[USER-A.N0-ADICIONAR-TAREFAS-CALENDARIO]',
  'PERM-[USER-A.N0-CALENDARIO]',
  'PERM-[USER-A.N0-KANBAN]',
  'PERM-[USER-A.N0-NOTAS]',
  'PERM-[USER-ATALHOS-A.N0-Programas-IXC]',
  'PERM-[USER-ATALHOS-A.N0-Analise-e-Monitoramento]',
  'PERM-[USER-ATALHOS-A.N0-Administração-e-Controle]',
  'PERM-[USER-ATALHOS-A.N0-Atendimento-ao-Publico]',
  'PERM-[USER-ATALHOS-A.N0-Programas-úteis]',
  'PERM-[REIS-USER-ATALHOS-A.N0-Atalhos-Administrativo]',
  'PERM-[REIS-USER-ATALHOS-A.N0-Atalhos-Uteis]',
  'PERM-[ADMIN-RELATORIO-ONU-HISTORICO]',
  'PERM-[ADMIN-USER-CADASTRADOS]',
  'PERM-[ADMIN-USER-EDITAR]',
  'PERM-[ADMIN-RELATORIO-VENDAS-MENSAL]'
  
];

// Criar o contexto
const PermissionsContext = createContext();

// Provider para gerenciar as permissões
export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState(
    PERMISSIONS_LIST.reduce((acc, perm) => ({ ...acc, [perm]: false }), {})
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPermissions = async () => {
      setIsLoading(true);
      try {
        const userDetails = JSON.parse(localStorage.getItem('usuario'));
        //console.log('Usuário obtido do localStorage no PermissionsProvider:', userDetails);
        //console.log('ID único sendo usado:', userDetails?.idUnico);
        const response = await fetchUserPermissions();
        //console.log('Permissões retornadas da API:', response);
        setPermissions(response);
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  const hasPermission = (permission) => {
    const hasPerm = permissions[permission] === true;
    //console.log(`Verificando permissão ${permission}:`, hasPerm, 'Valor no estado:', permissions[permission]);
    return hasPerm;
  };

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, isLoading, error }}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Hook personalizado para acessar as permissões
export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions deve ser usado dentro de um PermissionsProvider');
  }
  return context;
};