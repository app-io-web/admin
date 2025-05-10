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

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const ITENS_POR_PAGINA = 18;

export default function RelatorioOnusOffline() {
  const [dados, setDados] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [erro, setErro] = useState('');
  const jaIniciou = useRef(false);
  const [ultimaVerificacao, setUltimaVerificacao] = useState(null);
  const [mensagemLenta, setMensagemLenta] = useState(false);

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

  const iniciarStream = () => {
    sessionStorage.setItem('ja_usou_stream', '1');
    setCarregando(true);
    setFinalizado(false);
    setErro('');
    setDados([]);
    setPaginaAtual(1);

    const source = new EventSource('https://powerfail.smartolt.nexusnerds.com.br/api/onus-stream');
    const novosDados = [];

    source.onmessage = (event) => {
      try {
        const novaOnu = JSON.parse(event.data);
        const parsed = parsePowerFail(novaOnu);
        novosDados.push(parsed);
        setDados((prev) => [...prev, parsed]);
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

      setDados(processados);
      setFinalizado(true);
      setUltimaVerificacao(dayjs(json.verificado_em));
    } catch (err) {
      setErro('Erro ao buscar histórico.');
      console.error('❌ Erro ao carregar histórico:', err);
    } finally {
      setCarregando(false);
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
            setUltimaVerificacao(dayjs(json.verificado_em));
            const prioridadePeso = { red: 1, yellow: 2, orange: 3, green: 4 };
            const processados = json.data
              .map(parsePowerFail)
              .sort((a, b) => prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade]);
            setDados(processados);
            setFinalizado(true);
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

  const exportarParaExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      dadosFiltrados.map(item => ({
        Usuário: item.usuario,
        'ONU ID': item.onu_id,
        'Status': item.power_fail,
        'Tempo Offline': item.tempoFormatado,
        Prioridade: item.prioridade.toUpperCase()
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório ONU');

    const nomeArquivo = `Relatorio_ONUs_Offline_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`;
    XLSX.writeFile(workbook, nomeArquivo);
  };

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
              >
                <HStack justify="space-between">
                  <Text fontWeight="bold">{item.usuario}</Text>
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
    </Box>
  );
}
