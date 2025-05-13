// services/permissionsService.js

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
    'PERM-[ADMIN-RELATORIO-ONU-HISTORICO-H1]',
    'PERM-[ADMIN-USER-CADASTRADOS]',
    'PERM-[ADMIN-USER-EDITAR]',
    'PERM-[ADMIN-RELATORIO-VENDAS-MENSAL]',
    'PERM-[ADMIN-RELATORIO-CHART-VENDAS]'
  ];
  
  export const fetchUserPermissions = async () => {
    const userDetails = JSON.parse(localStorage.getItem('usuario'));
 //   console.log('Usuário obtido do localStorage:', userDetails);
  
    if (!userDetails?.idUnico) {
      console.error('Erro: Usuário não encontrado no localStorage.');
      throw new Error('Usuário não encontrado no localStorage.');
    }
  
    try {
      const response = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/mzekdm0ptp4sqlq/records?where=(UnicID_User,eq,${userDetails.idUnico})`,
        {
          headers: {
            'xc-token': 'PQFnWUYFjMfX7aAVow3zO11oNhyvQugsPoYWDVw6',
            'Content-Type': 'application/json',
          },
        }
      );
  
      const data = await response.json();
 //     console.log('Resposta da API:', data);
  
      if (data?.list?.length > 0) {
        const record = data.list[0];
        const permTotal = record['PERM-[TOTAL]']?.[0];
        if (permTotal) {
          const permissions = permTotal.Permissões || {};
 //         console.log('Permissões retornadas (antes de retornar):', permissions);
          return permissions;
        } else {
          console.error('Erro: Permissões não encontradas no registro.');
          throw new Error('Permissões não encontradas.');
        }
      } else {
 //       console.log('Nenhum registro encontrado, criando novo...');
        const newRecordPayload = {
          UnicID_User: userDetails.idUnico,
          'PERM-[TOTAL]': [
            {
              UnicID_User: userDetails.idUnico,
              Permissões: PERMISSIONS_LIST.reduce((acc, perm) => ({
                ...acc,
                [perm]: false,
              }), {}),
            },
          ],
        };
  
        const createResponse = await fetch(
          `https://nocodb.nexusnerds.com.br/api/v2/tables/mzekdm0ptp4sqlq/records`,
          {
            method: 'POST',
            headers: {
              'xc-token': 'PQFnWUYFjMfX7aAVow3zO11oNhyvQugsPoYWDVw6',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newRecordPayload),
          }
        );
  
        const createdData = await createResponse.json();
 //       console.log('Novo registro criado:', createdData);
  
        if (createdData && createdData['PERM-[TOTAL]']?.[0]?.Permissões) {
          const newPermissions = createdData['PERM-[TOTAL]'][0].Permissões;
  ///        console.log('Permissões do novo registro:', newPermissions);
          return newPermissions;
        } else {
          console.error('Erro: Falha ao criar novo registro de permissões.');
          throw new Error('Falha ao criar novo registro de permissões.');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      throw new Error('Não foi possível carregar as permissões.');
    }
  };