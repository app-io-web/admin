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
} from '@chakra-ui/react';
import { RepeatIcon, WarningTwoIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useState, useEffect, useRef } from 'react';
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

export default function RelatorioOnusOffline() {
  const [dados, setDados] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [erro, setErro] = useState('');
  const [modalOnuId, setModalOnuId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const jaIniciou = useRef(false);
  const [ultimaVerificacao, setUltimaVerificacao] = useState(null);
  const [mensagemLenta, setMensagemLenta] = useState(false);
  const [onusData, setOnusData] = useState([]); // Novo estado para armazenar ONUs
  const [contratosData, setContratosData] = useState([]); // Novo estado para armazenar contratos

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

  const iniciarStream = async () => {
    sessionStorage.setItem('ja_usou_stream', '1');
    setCarregando(true);
    setFinalizado(false);
    setErro('');
    setDados([]);
    setPaginaAtual(1);

    // Buscar ONUs e contratos antes de iniciar o stream
    await fetchOnusAndContratos();

    const source = new EventSource('https://powerfail.smartolt.nexusnerds.com.br/api/onus-stream');
    const novosDados = [];

    source.onmessage = (event) => {
      try {
        const novaOnu = JSON.parse(event.data);
        const parsed = parsePowerFail(novaOnu);
        const enriquecida = enriquecerOnu(parsed); // Enriquecer com status_internet
        novosDados.push(enriquecida);
        setDados((prev) => [...prev, enriquecida]);
      } catch (err) {
        console.error('❌ Erro ao parsear mensagem SSE:', err);
      }
    };

    source.addEventListener('end', () => {
      const prioridadePeso = { red: 1, yellow: 2, orange: 3, green: 4 };
      const ordenados = [...novosDados].sort((a, b) => prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade]);
      setDados(ordenados);
      setFinalizado(true);
      setCarregando(false);
      setUltimaVerificacao(dayjs());
      source.close();
    });

    source.addEventListener('error', (e) => {
      console.error('❌ Erro na conexão SSE:', e);
      setErro('Erro ao conectar com o servidor. Tentando reconectar...');
      setCarregando(false);
      source.close();
      setTimeout(iniciarStream, 5000);
    });
  };

  const carregarHistorico = async () => {
    setCarregando(true);
    try {
      const res = await fetch('https://powerfail.smartolt.nexusnerds.com.br/api/onus');
      const json = await res.json();

      const prioridadePeso = { red: 1, yellow: 2, orange: 3, green: 4 };
      const processados = json.data
        .map(parsePowerFail)
        .sort((a, b) => prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade]);

      // Buscar ONUs e contratos
      const { onus, contratos } = await fetchOnusAndContratos();

      const enriquecidos = processados.map(item => {
        const onuMatch = onus.find(o => o.mac === item.onu_id);
        const contrato = onuMatch ? contratos.find(c => String(c.id) === String(onuMatch.id_contrato)) : null;
        return { ...item, status_internet: contrato?.status_internet || '---' };
      });

      setDados(enriquecidos);
      setFinalizado(true);
      setUltimaVerificacao(dayjs(json.verificado_em));
    } catch (err) {
      setErro('Erro ao buscar histórico.');
      console.error('❌ Erro ao carregar histórico:', err);
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório ONU');

      const nomeArquivo = `Relatorio_ONUs_Offline_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`;
      XLSX.writeFile(workbook, nomeArquivo);
    } catch (e) {
      console.error('❌ Erro ao exportar XLSX com dados enriquecidos:', e);
      alert('Erro ao exportar os dados. Tente novamente.');
    }
  };

  useEffect(() => {
    if (jaIniciou.current) return;
    jaIniciou.current = true;

    const verificarHistoricoOuStream = async () => {
      try {
        const res = await fetch('https://powerfail.smartolt.nexusnerds.com.br/api/onus');
        const json = await res.json();

        if (json?.verificado_em) {
          const hoje = dayjs().format('YYYY-MM-DD');
          const dataJson = dayjs(json.verificado_em).format('YYYY-MM-DD');

          if (dataJson === hoje) {
            await carregarHistorico();
            return;
          }
        }

        iniciarStream();
      } catch (err) {
        console.error('❌ Erro ao verificar histórico:', err);
        setErro('Erro ao verificar histórico. Tentando stream...');
        iniciarStream();
      }
    };

    verificarHistoricoOuStream();
  }, []);

  useEffect(() => {
    let timeout;
    if (carregando) {
      timeout = setTimeout(() => {
        setMensagemLenta(true);
      }, 5000);
    } else {
      setMensagemLenta(false);
      clearTimeout(timeout);
    }
    return () => clearTimeout(timeout);
  }, [carregando]);

  return (
    <Box p={6} bg={bg} borderWidth="1px" borderRadius="md" borderColor={border} boxShadow="md">
      <HStack justify="space-between" mb={4} wrap="wrap" gap={2}>
        <Heading fontSize="lg">Relatório de ONUs Offline</Heading>

        {ultimaVerificacao && (
          <Text fontSize="sm" color="gray.500">
            Última verificação: {ultimaVerificacao.format('DD/MM/YYYY HH:mm')}
          </Text>
        )}

        <HStack>
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
            leftIcon={<RepeatIcon />}
            onClick={iniciarStream}
            isLoading={carregando}
          >
            Iniciar Verificação
          </Button>
        </HStack>
      </HStack>

      {mensagemLenta && carregando && (
        <Text fontSize="sm" color="orange.400" mt={2}>
          ⏳ Isso pode levar alguns segundos. Verificação em andamento...
        </Text>
      )}

      {carregando && dadosFiltrados.length === 0 && (
        <Spinner size="lg" thickness="4px" color="red.400" />
      )}

      {erro && <Text color="red.500">{erro}</Text>}

      {!carregando && dadosFiltrados.length === 0 && finalizado && (
        <Text color="gray.500">Nenhuma ONU offline foi encontrada.</Text>
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

      {finalizado && (
        <Text mt={4} fontSize="sm" color="green.500">
          ✅ Verificação finalizada.
        </Text>
      )}

      <ModalInfoOnu
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onuId={modalOnuId}
      />
    </Box>
  );
}