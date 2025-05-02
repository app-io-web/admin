// src/components/GraficoStatusClientesMaxFibra.jsx
import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  IconButton,
  Flex,
  Text,
  Tooltip,
  useColorModeValue,
  useBreakpointValue
} from '@chakra-ui/react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FaChartPie, FaChartBar } from 'react-icons/fa';

export default function GraficoStatusClientesMaxFibra() {
  const [ativos, setAtivos] = useState(0);
  const [bloqueados, setBloqueados] = useState(0);
  const [modo, setModo] = useState('coluna');
  const [tempoRestante, setTempoRestante] = useState(300);

  const corAtivo = useColorModeValue('#38A169', '#48BB78');
  const corBloqueado = useColorModeValue('#E53E3E', '#F56565');
  const bgBox = useColorModeValue('white', 'gray.800');
  const bgTooltip = useColorModeValue('white', 'gray.700');
  const textTooltip = useColorModeValue('black', 'white');

  // Altura do chart responsiva
  const chartHeight = useBreakpointValue({ base: 200, md: 300 });

  // Fetch dos dados
  useEffect(() => {
    async function fetchData() {
      try {
        const [r1, r2] = await Promise.all([
          fetch('https://apidoixc.nexusnerds.com.br/data/resultado.json').then(r => r.json()),
          fetch('https://apidoixc.nexusnerds.com.br/data/contagem_Bloqueados_filtrada.json').then(r => r.json())
        ]);
        setAtivos(r1.numeroDeClientesAtivos || 0);
        setBloqueados(r2.count || 0);
        setTempoRestante(300); // ✅ RESETA sempre que atualizar
      } catch (err) {
        console.error(err);
      }
    }
  
    fetchData(); // inicial
    const id = setInterval(fetchData, 300_000); // a cada 5 min
    return () => clearInterval(id);
  }, []);
  

  // Contador regressivo
  useEffect(() => {
    const id = setInterval(() => {
      setTempoRestante(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const dadosGrafico = [{ nome: 'MAX FIBRA', ativos, bloqueados }];
  const dadosPizza   = [
    { name: 'Ativos', value: ativos },
    { name: 'Bloqueados', value: bloqueados }
  ];
  const cores = [corAtivo, corBloqueado];

  return (
    <Box
      w="100%"
      p={4}
      bg="whiteAlpha.100"
      borderRadius="md"
      boxShadow="md"
    >

      <Flex justify="space-between" align="center" mb={7}>
        <Heading size="md">Clientes</Heading>
        <Tooltip label={`Visualização: ${modo === 'coluna' ? 'Coluna' : 'Pizza'}`}>
          <IconButton
            icon={modo === 'coluna' ? <FaChartPie /> : <FaChartBar />}
            onClick={() => setModo(modo === 'coluna' ? 'pizza' : 'coluna')}
            aria-label="Alternar visualização"
            size="sm"
            variant="outline"
            isRound
            borderColor={useColorModeValue('gray.200','gray.600')}
            _hover={{ bg: useColorModeValue('gray.100','gray.700') }}
          />
        </Tooltip>
      </Flex>

      <ResponsiveContainer width="100%" height={chartHeight}>
        {modo === 'coluna' ? (
          <ComposedChart data={dadosGrafico}>
            <XAxis dataKey="nome" />
            <YAxis />
            <ReTooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const { nome, ativos, bloqueados } = payload[0].payload;
                return (
                  <Box bg={bgTooltip} color={textTooltip} p={3} borderRadius="md" boxShadow="md">
                    <strong>{nome}</strong>
                    <Box color={corAtivo}>Ativos: {ativos}</Box>
                    <Box color={corBloqueado}>Bloqueados: {bloqueados}</Box>
                  </Box>
                );
              }}
            />
            <Legend />
            <Bar dataKey="ativos" fill={corAtivo} name="Ativos" />
            <Bar dataKey="bloqueados" fill={corBloqueado} name="Bloqueados" />
            <Line type="monotone" dataKey="ativos"    stroke={corAtivo}    dot={false} legendType="none" />
            <Line type="monotone" dataKey="bloqueados" stroke={corBloqueado} dot={false} legendType="none" />
          </ComposedChart>
        ) : (
          <PieChart>
            <ReTooltip />
            <Legend />
            <Pie
              data={dadosPizza}
              cx="50%"
              cy="50%"
              outerRadius={chartHeight / 2.2}
              dataKey="value"
              label
            >
              {dadosPizza.map((_, i) => (
                <Cell key={i} fill={cores[i]} />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>

      <Text mt={4} textAlign="center" fontSize="sm" color="gray.500">
          Atualização em {Math.floor(tempoRestante / 60)}:{String(tempoRestante % 60).padStart(2, '0')} min
        </Text>

    </Box>
  );
}
