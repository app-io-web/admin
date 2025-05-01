import { useState, useEffect } from 'react';
import {
  Box, Heading, Button, HStack, Tag, TagLabel, TagCloseButton, VStack, useToast, Spinner, Select
} from '@chakra-ui/react';

export default function ConfigServicosPlanos() {
  const [servicos, setServicos] = useState({
    'Plano Turbo': [],
    'Plano Infinity': [],
    'Plano Gold': []
  });
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Opções fixas:
  const opcoesCampos = {
    'Plano Turbo': ['Ubook Plus', 'Estuda+', 'PlayKids'],
    'Plano Infinity': ['Max', 'Sky+ Globo Lite', 'NBA - Esportes', 'Estuda+', 'Kaspesky', 'O Jornalista', 'DocWay', 'Queima Diaria'],
    'Plano Gold': ['NoPing', 'Estuda+', 'Kaspesky', 'Deezer', 'O Jornalista', 'Queima Diaria', 'PlayKids']
  };

  const fetchServicos = async () => {
    try {
      const res = await fetch('https://api.configsite.nexusnerds.com.br/servicos-planos');
      const data = await res.json();
      const registro = data.list?.[0];
      if (registro) {
        setServicos({
          'Plano Turbo': registro['Plano Turbo']?.split(',') || [],
          'Plano Infinity': registro['Plano Infinity']?.split(',') || [],
          'Plano Gold': registro['Plano Gold']?.split(',') || []
        });
        setRecordId(registro.Id);
      }
    } catch (err) {
      toast({ title: 'Erro ao buscar serviços', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServicos(); }, []);

  const salvar = async () => {
    try {
      const payload = {
        Id: recordId,
        'Plano Turbo': servicos['Plano Turbo'].join(','),
        'Plano Infinity': servicos['Plano Infinity'].join(','),
        'Plano Gold': servicos['Plano Gold'].join(',')
      };
      const res = await fetch('https://api.configsite.nexusnerds.com.br/servicos-planos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([payload]),
      });
      if (res.ok) {
        toast({ title: 'Serviços atualizados!', status: 'success' });
      } else {
        toast({ title: 'Erro ao salvar', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Falha ao salvar', status: 'error' });
    }
  };

  const adicionarServico = (plano, servicoSelecionado) => {
    if (servicoSelecionado && !servicos[plano].includes(servicoSelecionado)) {
      setServicos((prev) => ({
        ...prev,
        [plano]: [...prev[plano], servicoSelecionado]
      }));
    }
  };

  const removerServico = (plano, servico) => {
    setServicos((prev) => ({
      ...prev,
      [plano]: prev[plano].filter((s) => s !== servico)
    }));
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <Box>
      <Heading size="md" mb={4}>Serviços Adicionais dos Planos</Heading>
      <VStack spacing={5} align="flex-start" w="100%">
        {['Plano Turbo', 'Plano Infinity', 'Plano Gold'].map((plano) => (
          <Box key={plano} w="100%">
            <Heading size="sm" mb={2}>{plano}</Heading>
            <HStack wrap="wrap">
              {servicos[plano].map((servico) => (
                <Tag key={servico} colorScheme="blue" m={1}>
                  <TagLabel>{servico}</TagLabel>
                  <TagCloseButton onClick={() => removerServico(plano, servico)} />
                </Tag>
              ))}
            </HStack>
            <Select
              placeholder={`Adicionar serviço ao ${plano}`}
              onChange={(e) => adicionarServico(plano, e.target.value)}
              mt={2}
            >
              {opcoesCampos[plano]
                .filter((opcao) => !servicos[plano].includes(opcao))
                .map((opcao) => (
                  <option key={opcao} value={opcao}>{opcao}</option>
                ))}
            </Select>
          </Box>
        ))}
        <Button colorScheme="green" onClick={salvar}>Salvar Alterações</Button>
      </VStack>
    </Box>
  );
}
