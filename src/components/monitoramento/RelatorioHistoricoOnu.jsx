import {
  Box,
  Heading,
  Text,
  Spinner,
  Button,
  SimpleGrid,
  HStack,
  Icon,
  useColorModeValue,
  Tag,
  ButtonGroup,
  Select,
} from '@chakra-ui/react';
import { WarningTwoIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import * as XLSX from 'xlsx';
import ModalInfoOnu from './ModalInfoOnu';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const ITENS_POR_PAGINA = 18;

const traduzirStatusInternet = (codigo) => {
  switch (codigo) {
    case 'A': return { label: 'Ativo', color: 'green' };
    case 'D': return { label: 'Desativado', color: 'gray' };
    case 'CM': return { label: 'Bloq. Manual', color: 'red' };
    case 'CA': return { label: 'Bloq. Automático', color: 'orange' };
    case 'FA': return { label: 'Financeiro', color: 'red' };
    case 'AA': return { label: 'Assinatura', color: 'yellow' };
    default: return { label: '---', color: 'gray' };
  }
};

export default function RelatorioHistoricoOnus() {
  const [dados, setDados] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [modalOnuId, setModalOnuId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ultimaVerificacao, setUltimaVerificacao] = useState(null);
  const [datasDisponiveis, setDatasDisponiveis] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [onusData, setOnusData] = useState([]);
  const [contratosData, setContratosData] = useState([]);
  const [analiseHistorico, setAnaliseHistorico] = useState(false);

  const bg = useColorModeValue('whiteAlpha.700', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.600');

  const dadosFiltrados = dados.filter(
    (item) => item.onu_id && item.tempoFormatado !== 'há poucos segundos'
  );

  const totalPaginas = Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA);
  const dadosPaginados = dadosFiltrados.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  const processarPrioridade = (dataRaw) => {
    const dias = dayjs().diff(dataRaw, 'day');
    if (dias > 60) return 'red';
    if (dias > 30) return 'yellow';
    if (dias > 10) return 'orange';
    return 'green';
  };

  const parsePowerFail = (item) => {
    const match = item.power_fail?.match(/\((.*?)\)/);
    const raw = match ? match[1] : '';
    const dataRaw = dayjs().subtract(...parseRelative(raw));
    const tempoFormatado = dayjs(dataRaw).fromNow();
    const prioridade = processarPrioridade(dataRaw);

    return {
      ...item,
      tempoFormatado,
      prioridade,
      dataRaw,
    };
  };

  const parseRelative = (str) => {
    if (!str) return [0, 'minute'];
    const parts = str.split(' ');
    const valor = parseInt(parts[0]);
    const unidade = parts[1]?.replace(/s?$/, '') || 'minute';
    return [isNaN(valor) ? 0 : valor, unidade];
  };

  const fetchOnusAndContratos = async () => {
    try {
      const resOnus = await fetch('https://apidoixc.nexusnerds.com.br/Data/onus.json');
      const listaOnus = await resOnus.json();
      const onus = listaOnus.registros || listaOnus.data || [];
      setOnusData(onus);

      const resContratos = await fetch('https://apidoixc.nexusnerds.com.br/Data/todos_contratos.json');
      const contratosRes = await resContratos.json();
      const contratos = contratosRes.registros || [];
      setContratosData(contratos);

      return { onus, contratos };
    } catch (err) {
      console.error('❌ Erro ao buscar ONUs e contratos:', err);
      return { onus: [], contratos: [] };
    }
  };

  const enriquecerOnu = (onu) => {
    const onuMatch = onusData.find(o => o.mac === onu.onu_id);
    const contrato = onuMatch ? contratosData.find(c => String(c.id) === String(onuMatch.id_contrato)) : null;
    return { ...onu, status_internet: contrato?.status_internet || '---' };
  };

  const fetchDatasDisponiveis = async () => {
    try {
      setCarregando(true);
      const res = await fetch('https://powerfail.smartolt.nexusnerds.com.br/api/onus/historico');
      if (!res.ok) {
        throw new Error(`Erro HTTP: ${res.status} - ${res.statusText}`);
      }
      const json = await res.json();
      if (json.datas && Array.isArray(json.datas)) {
        setDatasDisponiveis(json.datas);
        if (json.datas.length > 0) {
          setDataSelecionada(json.datas[0]); // Seleciona a data mais recente
        }
      } else {
        setErro('Nenhuma data disponível no histórico.');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar datas disponíveis:', err);
      setErro('Erro ao carregar datas disponíveis. Verifique se o servidor está ativo.');
    } finally {
      setCarregando(false);
    }
  };

  const carregarRelatorio = async (data) => {
    if (!data) return;
    setCarregando(true);
    setErro('');
    setDados([]);
    setPaginaAtual(1);

    try {
      const res = await fetch(`https://powerfail.smartolt.nexusnerds.com.br/api/onus/historico/${data}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Relatório não encontrado para esta data.');
        }
        throw new Error(`Erro HTTP: ${res.status} - ${res.statusText}`);
      }
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        const { onus, contratos } = await fetchOnusAndContratos();
        const prioridadePeso = { red: 1, yellow: 2, orange: 3, green: 4 };
        const processados = json.data
          .map(parsePowerFail)
          .sort((a, b) => prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade]);
        const enriquecidos = processados.map(item => enriquecerOnu(item));
        setDados(enriquecidos);
        setUltimaVerificacao(dayjs(json.verificado_em));
      } else if (json.registros && Array.isArray(json.registros)) {
        const { onus, contratos } = await fetchOnusAndContratos();
        const prioridadePeso = { red: 1, yellow: 2, orange: 3, green: 4 };
        const processados = json.registros
          .map(parsePowerFail)
          .sort((a, b) => prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade]);
        const enriquecidos = processados.map(item => enriquecerOnu(item));
        setDados(enriquecidos);
        setUltimaVerificacao(dayjs(json.verificado_em));
      } else {
        setDados([]);
        setUltimaVerificacao(null);
        setErro('Nenhum dado encontrado para esta data.');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar relatório:', err);
      setErro(`Erro ao carregar relatório: ${err.message}`);
    } finally {
      setCarregando(false);
    }
  };

  const exportarParaExcel = async () => {
    try {
      const resClientes = await fetch('https://apidoixc.nexusnerds.com.br/Data/clientesAtivos.json');
      const clientesRes = await resClientes.json();
      const clientes = clientesRes.registros || [];

      const enrichedData = dadosFiltrados.map((item) => {
        const onu = onusData.find(o => o.mac === item.onu_id);
        const contrato = onu ? contratosData.find(c => String(c.id) === String(onu.id_contrato)) : null;
        const cliente = contrato ? clientes.find(c => String(c.id) === String(contrato.id_cliente)) : null;

        const nome = cliente?.fantasia || '---';
        const telefone = cliente?.telefone_celular || cliente?.whatsapp || '---';
        const latitude = cliente?.latitude;
        const longitude = cliente?.longitude;
        const linkMaps = latitude && longitude
          ? `https://www.google.com/maps?q=${latitude},${longitude}`
          : '---';
        const statusInternet = traduzirStatusInternet(item.status_internet).label;

        return {
          Usuário: item.usuario,
          'ONU ID': item.onu_id,
          'Status': item.power_fail,
          'Tempo Offline': item.tempoFormatado,
          Prioridade: item.prioridade.toUpperCase(),
          'Status Internet': statusInternet,
          'Nome do Cliente': nome,
          'Telefone': telefone,
          'Localização (Google Maps)': linkMaps,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(enrichedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Histórico ONU');

      const nomeArquivo = `Relatorio_Historico_ONUs_${dataSelecionada}_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`;
      XLSX.writeFile(workbook, nomeArquivo);
    } catch (e) {
      console.error('❌ Erro ao exportar XLSX com dados enriquecidos:', e);
      alert('Erro ao exportar os dados. Tente novamente.');
    }
  };

  useEffect(() => {
    fetchDatasDisponiveis();
  }, []);

  useEffect(() => {
    if (dataSelecionada) {
      carregarRelatorio(dataSelecionada);
    }
  }, [dataSelecionada]);


  const analisarHistoricoCompleto = async () => {
  setCarregando(true);
  setErro('');
  setDados([]);
  setPaginaAtual(1);
  setAnaliseHistorico(true);

  try {
    const { onus, contratos } = await fetchOnusAndContratos();

    const registrosMap = new Map();

    for (const data of datasDisponiveis) {
      const res = await fetch(`https://powerfail.smartolt.nexusnerds.com.br/api/onus/historico/${data}`);
      const json = await res.json();
      const lista = json.data || json.registros || [];

      for (const item of lista) {
        if (!item.onu_id) continue;
        const match = item.power_fail?.match(/\((.*?)\)/);
        const raw = match ? match[1] : '';
        const dataRaw = dayjs(data).subtract(...parseRelative(raw));

        const atual = registrosMap.get(item.onu_id);
        if (!atual || dataRaw.isBefore(atual.dataRaw)) {
          registrosMap.set(item.onu_id, {
            ...item,
            dataInicial: dataRaw,
            tempoFormatado: dayjs(dataRaw).fromNow(),
            prioridade: processarPrioridade(dataRaw),
            dataRaw,
          });
        }
      }
    }

    const listaFinal = Array.from(registrosMap.values())
      .sort((a, b) => a.dataRaw - b.dataRaw)
      .map(enriquecerOnu);

    setDados(listaFinal);
    setUltimaVerificacao(dayjs());
  } catch (err) {
    console.error('❌ Erro ao analisar histórico completo:', err);
    setErro('Erro ao analisar o histórico completo.');
  } finally {
    setCarregando(false);
    setAnaliseHistorico(false);
  }
};


  return (
    <Box p={6} bg={bg} borderWidth="1px" borderRadius="md" borderColor={border} boxShadow="md">
      <HStack justify="space-between" mb={4} wrap="wrap" gap={2}>
        <Heading fontSize="lg">Histórico de Relatórios de ONUs Offline</Heading>

        {ultimaVerificacao && (
          <Text fontSize="sm" color="gray.500">
            Última verificação: {ultimaVerificacao.format('DD/MM/YYYY HH:mm')}
          </Text>
        )}

      <HStack spacing={3} flexWrap="wrap">
        <Select
          placeholder="Selecione uma data"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          maxW="200px"
          isDisabled={carregando || datasDisponiveis.length === 0}
          size="sm"
        >
          {datasDisponiveis.map((data) => (
            <option key={data} value={data}>
              {dayjs(data).format('DD/MM/YYYY')}
            </option>
          ))}
        </Select>

        <Button
          size="sm"
          colorScheme="blue"
          onClick={exportarParaExcel}
          isDisabled={dadosFiltrados.length === 0}
        >
          Baixar XLSX
        </Button>

        <Button
          size="sm"
          colorScheme="purple"
          onClick={analisarHistoricoCompleto}
          isDisabled={carregando || datasDisponiveis.length === 0}
        >
          Analisar Todo o Histórico
        </Button>
      </HStack>

      </HStack>

      {carregando && dadosFiltrados.length === 0 && (
        <Spinner size="lg" thickness="4px" color="blue.400" />
      )}

      {erro && <Text color="red.500">{erro}</Text>}

      {!carregando && datasDisponiveis.length === 0 && (
        <Text color="gray.500">Nenhum relatório histórico encontrado.</Text>
      )}

      {!carregando && dataSelecionada && dadosFiltrados.length === 0 && !erro && (
        <Text color="gray.500">Nenhuma ONU offline encontrada para esta data.</Text>
      )}

      {dadosFiltrados.length > 0 && (
        <>
          <Text fontSize="sm" color="gray.600" mb={2}>
            Total encontrado: {dadosFiltrados.length}
          </Text>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {dadosPaginados.map((item, i) => (
              <Box
                key={i}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                bg={`${item.prioridade}.50`}
                borderColor={`${item.prioridade}.300`}
                cursor="pointer"
                onClick={() => {
                  setModalOnuId(item.onu_id);
                  setIsModalOpen(true);
                }}
              >
                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Text fontWeight="bold">{item.usuario}</Text>
                    {item.status_internet && (
                      <Tag size="sm" colorScheme={traduzirStatusInternet(item.status_internet).color}>
                        {traduzirStatusInternet(item.status_internet).label}
                      </Tag>
                    )}
                  </HStack>
                  <Icon as={WarningTwoIcon} color={`${item.prioridade}.500`} />
                </HStack>
                <Text fontSize="sm">ONU ID: {item.onu_id}</Text>
                <HStack mt={1} justify="space-between">
                  <Text fontSize="sm" color="gray.600">{item.power_fail}</Text>
                  <Tag size="sm" colorScheme={item.prioridade}>
                    {item.tempoFormatado}
                  </Tag>
                </HStack>
              </Box>
            ))}
          </SimpleGrid>

          {totalPaginas > 1 && (
            <HStack mt={6} justify="center">
              <ButtonGroup size="sm" isAttached variant="outline">
                <Button
                  leftIcon={<ChevronLeftIcon />}
                  onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                  isDisabled={paginaAtual === 1}
                >
                  Anterior
                </Button>
                <Button disabled>
                  Página {paginaAtual} de {totalPaginas}
                </Button>
                <Button
                  rightIcon={<ChevronRightIcon />}
                  onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                  isDisabled={paginaAtual === totalPaginas}
                >
                  Próxima
                </Button>
              </ButtonGroup>
            </HStack>
          )}
        </>
      )}

      <ModalInfoOnu
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onuId={modalOnuId}
      />
    </Box>
  );
}