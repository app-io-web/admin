import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Heading,
  Checkbox,
  Spinner,
  Text,
  Image,
  Stack,
  Button,
  useToast,
  VStack,
  Divider,
} from '@chakra-ui/react';
import SideBar from '../../components/layout/SideBar';
import BottomBar from '../../components/layout/BottomBar';
import PerfilUsuarioDesktop from '../../components/layout/PerfilUsuarioDesktop';

const PermissionsPage = () => {
  const location = useLocation();
  const userDetails = location.state?.userDetails;

  // Organizar permissões por grupos
  const PERMISSIONS_GROUPS = {
    financeiro: {
      label: 'Permissões de Nível Financeiro',
      total: 'PERM-[FINANCEIRO-TOTAL]',
      permissions: [
        'PERM-[FINANCEIRO-CLIENTES-BLOQUEADOS]',
        'PERM-[FINANCEIRO-CFG-COBRANÇA]',
        'PERM-[ADMIN-ATALHOS]',
        'PERM-[ADMIN-ATALHOS-PESSOAIS]',
      ],
    },
    administrador: {
      label: 'Permissões de Nível Administrador',
      total: 'PERM-[ADMIN-TOTAL]',
      permissions: [
        'PERM-[ADMIN-CREATE-USER]',
        'PERM-[ADMIN-CONSULTA-VIR-TELECOM]',
        'PERM-[ADMIN-RELATORIO-BLOQUEADOS]',
        'PERM-[ADMIN-RELATORIO-ATIVADOS]',
        'PERM-[ADMIN-RELATORIO-FECHAMENTO-HISTORICO]',
        'PERM-[ADMIN-DASBOARD]',
        'PERM-[ADMIN-CONFIG]',
        'PERM-[ADMIN-ATALHOS]',
        'PERM-[ADMIN-ATALHOS-PESSOAIS]',
        'PERM-[ADMIN-ACESSO-PERMISSOES]',
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
      ],
    },
    avancadoN1: {
      label: 'Permissões de Nível Avançado N1',
      total: 'PERM-[AVANÇADO-A.N1-TOTAL]',
      permissions: [
        'PERM-[AVANÇADO-A.N1-CAMPOS-GERAIS]',        
        'PERM-[AVANÇADO-A.N1-SERVICOSPLANOS]',
        'PERM-[AVANÇADO-A.N1-VENDEDORES]',
        'PERM-[AVANÇADO-A.N1-CUPOMDESCONTO]',
        'PERM-[AVANÇADO-A.N1-PLANOS-EMPRESARIAL]',
        'PERM-[AVANÇADO-A.N1-DUVIDAS-FREQUENTE]',
        'PERM-[AVANÇADO-A.N1-FRASES-DINAMICAS]',
        'PERM-[AVANÇADO-A.N1-SERVICOS-ADICIONAIS]',
        'PERM-[AVANÇADO-A.N1-BANNER-PRINCIPAL]',
        'PERM-[AVANÇADO-A.N1-BANNER-EMPRESARIAL]',
        'PERM-[AVANÇADO-A.N1-INTEGRAÇÃO-GOOGLE-CALENDARIO]',
      ],
    },
  };

  // Lista completa de permissões para o estado
  const PERMISSIONS_LIST = [
    ...Object.values(PERMISSIONS_GROUPS).flatMap(group => [group.total, ...group.permissions]),
  ];

  const [permissions, setPermissions] = useState(
    PERMISSIONS_LIST.reduce((acc, perm) => ({ ...acc, [perm]: false }), {})
  );

  const [isLoading, setIsLoading] = useState(true);
  const [recordId, setRecordId] = useState(null);
  const [permItemId, setPermItemId] = useState(null);
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const toast = useToast();

  useEffect(() => {
    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
       // console.log('Buscando permissões para UnicID_User:', userDetails?.UnicID_User);
        const response = await fetch(
          `https://nocodb.nexusnerds.com.br/api/v2/tables/mzekdm0ptp4sqlq/records?where=(UnicID_User,eq,${userDetails?.UnicID_User})`,
          {
            headers: {
              'xc-token': 'PQFnWUYFjMfX7aAVow3zO11oNhyvQugsPoYWDVw6',
              'Content-Type': 'application/json',
            },
          }
        );
  
        const data = await response.json();
        //console.log('Resposta da API (busca inicial):', JSON.stringify(data, null, 2));
  
        if (data?.list?.length > 0) {
          const record = data.list[0];
          const permTotal = Array.isArray(record['PERM-[TOTAL]']) && record['PERM-[TOTAL]'].length > 0 ? record['PERM-[TOTAL]'][0] : null;
  
          if (record.Id && permTotal?.Permissões) {
            // Caso o registro já tenha permissões válidas
            const userPermissions = permTotal.Permissões || {};
            setRecordId(record.Id);
            setPermissions(
              PERMISSIONS_LIST.reduce((acc, perm) => ({
                ...acc,
                [perm]: userPermissions[perm] ?? false,
              }), {})
            );
          } else {
            //console.log('Nenhum item de permissão válido encontrado, criando novo...');
            const newPermItem = {
              UnicID_User: userDetails.UnicID_User,
              Permissões: PERMISSIONS_LIST.reduce((acc, perm) => ({
                ...acc,
                [perm]: false,
              }), {}),
            };
  
            const updatePayload = {
              Id: record.Id,
              UnicID_User: userDetails.UnicID_User,
              'PERM-[TOTAL]': [newPermItem],
            };
  
            const updateResponse = await fetch(
              `https://nocodb.nexusnerds.com.br/api/v2/tables/mzekdm0ptp4sqlq/records`,
              {
                method: 'PATCH',
                headers: {
                  'xc-token': 'PQFnWUYFjMfX7aAVow3zO11oNhyvQugsPoYWDVw6',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify([updatePayload]),
              }
            );
  
            if (!updateResponse.ok) {
              throw new Error('Falha ao atualizar o registro com novas permissões');
            }
  
            const updatedData = await updateResponse.json();
            //console.log('Resposta da API (após atualização):', JSON.stringify(updatedData, null, 2));
  
            setRecordId(record.Id);
            setPermissions(newPermItem.Permissões);
          }
        } else {
          //console.log('Nenhum registro encontrado, criando novo...');
          const newRecordPayload = {
            UnicID_User: userDetails.UnicID_User,
            'PERM-[TOTAL]': [
              {
                UnicID_User: userDetails.UnicID_User,
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
  
          if (!createResponse.ok) {
            throw new Error('Falha ao criar novo registro');
          }
  
          const createdData = await createResponse.json();
          //console.log('Resposta da API (novo registro):', JSON.stringify(createdData, null, 2));
  
          if (!createdData.Id) {
            throw new Error('ID do registro não retornado após criação');
          }
  
          setRecordId(createdData.Id);
          setPermissions(newRecordPayload['PERM-[TOTAL]'][0].Permissões);
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as permissões.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    if (userDetails) {
      fetchPermissions();
    }
  }, [userDetails, toast]);

  // Função para lidar com mudanças nas permissões
  const handlePermissionChange = (perm) => {
    setPermissions((prevPermissions) => {
      const newPermissions = { ...prevPermissions };
      newPermissions[perm] = !newPermissions[perm];

      // Lógica para permissões "TOTAL"
      if (perm === PERMISSIONS_GROUPS.financeiro.total) {
        const value = newPermissions[perm];
        PERMISSIONS_GROUPS.financeiro.permissions.forEach((p) => {
          newPermissions[p] = value;
        });
      } else if (perm === PERMISSIONS_GROUPS.administrador.total) {
        const value = newPermissions[perm];
        // Ativa todas as permissões, exceto as de nível Avançado N1
        Object.values(PERMISSIONS_GROUPS).forEach((group) => {
          if (group !== PERMISSIONS_GROUPS.avancadoN1) {
            group.permissions.forEach((p) => {
              newPermissions[p] = value;
            });
          }
        });
      } else if (perm === PERMISSIONS_GROUPS.avancadoN1.total) {
        const value = newPermissions[perm];
        // Ativa todas as permissões
        PERMISSIONS_LIST.forEach((p) => {
          newPermissions[p] = value;
        });
      }

      // Verifica se todas as permissões de um grupo estão marcadas para atualizar o "TOTAL"
      Object.values(PERMISSIONS_GROUPS).forEach((group) => {
        const allChecked = group.permissions.every((p) => newPermissions[p]);
        newPermissions[group.total] = allChecked;
      });

      return newPermissions;
    });
  };

  const savePermissions = async () => {
    if (!recordId) {
      toast({
        title: 'Erro',
        description: 'ID do registro não encontrado.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  
    setIsLoading(true);
    try {
      const payload = [
        {
          Id: recordId,
          UnicID_User: userDetails.UnicID_User,
          'PERM-[TOTAL]': [
            {
              UnicID_User: userDetails.UnicID_User,
              Permissões: permissions,
            },
          ],
        },
      ];
  
      const response = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/mzekdm0ptp4sqlq/records`,
        {
          method: 'PATCH',
          headers: {
            'xc-token': 'PQFnWUYFjMfX7aAVow3zO11oNhyvQugsPoYWDVw6',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
  
      const data = await response.json();
      if (response.ok && data) {
        toast({
          title: 'Permissões atualizadas',
          description: 'As permissões foram atualizadas com sucesso.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error('Erro ao atualizar permissões');
      }
    } catch (error) {
      console.error('Erro ao salvar permissões', error);
      toast({
        title: 'Erro ao salvar permissões',
        description: 'Não foi possível salvar as permissões.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userDetails) {
    return <Text>Erro: Detalhes do usuário não encontrados.</Text>;
  }

  return (
    <Box display="flex" minH="100vh" position="relative">
      <SideBar />
      <Box
        flex="1"
        p={{ base: 4, md: 6 }}
        pt={{ base: 4, md: 6 }}
        pb={{ base: 24, md: 6 }}
        minH="100vh"
        overflowX="hidden"
        overflowY="auto"
      >
      <Box
        position="fixed"
        top="20px"
        right="24px"
        zIndex={30}
        display={{ base: 'none', md: 'block' }}
      >
        <PerfilUsuarioDesktop usuario={usuario} />
      </Box>
      
        <Box p={6} borderWidth={1} borderRadius="lg" maxWidth="600px" margin="0 auto">
          {isLoading ? (
            <Spinner size="lg" />
          ) : (
            <>
              <Box display="flex" alignItems="center" mb={4}>
                {userDetails.pic_profile_link ? (
                  <Image
                    boxSize="50px"
                    borderRadius="full"
                    src={userDetails.pic_profile_link}
                    alt="Foto de Perfil"
                    fallbackSrc="https://via.placeholder.com/50"
                    mr={4}
                  />
                ) : (
                  <Box
                    w="50px"
                    h="50px"
                    borderRadius="full"
                    bg="gray.200"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    mr={4}
                  >
                    <Text fontSize="20px">{userDetails.name.charAt(0)}</Text>
                  </Box>
                )}
                <Box>
                  <Heading size="sm">{userDetails.name}</Heading>
                  <Text>{userDetails.email}</Text>
                  <Text fontStyle="italic" color="gray.500">{userDetails.type}</Text>
                </Box>
              </Box>

              <Heading size="md" mb={4}>Permissões</Heading>

              <VStack spacing={6} align="stretch" mb={6}>
                {Object.values(PERMISSIONS_GROUPS).map((group, groupIndex) => (
                  <Box key={groupIndex}>
                    <Heading size="sm" mb={2}>{group.label}</Heading>
                    <Stack spacing={2} pl={4}>
                      <Checkbox
                        isChecked={permissions[group.total]}
                        onChange={() => handlePermissionChange(group.total)}
                        colorScheme="green"
                        fontWeight="bold"
                      >
                        {group.total} (Selecionar Tudo)
                      </Checkbox>
                      {group.permissions.map((perm, index) => (
                        <Checkbox
                          key={index}
                          isChecked={permissions[perm]}
                          onChange={() => handlePermissionChange(perm)}
                          colorScheme="green"
                          pl={6}
                        >
                          {perm}
                        </Checkbox>
                      ))}
                    </Stack>
                    {groupIndex < Object.values(PERMISSIONS_GROUPS).length - 1 && (
                      <Divider my={4} />
                    )}
                  </Box>
                ))}
              </VStack>

              <Button
                colorScheme="green"
                onClick={savePermissions}
                isLoading={isLoading}
                loadingText="Salvando..."
              >
                Salvar Permissões
              </Button>
            </>
          )}
        </Box>
      </Box>
      <BottomBar />
    </Box>
  );
};

export default PermissionsPage;