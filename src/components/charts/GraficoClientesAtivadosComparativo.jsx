import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Tooltip as ChakraTooltip, IconButton,
  useColorModeValue
} from '@chakra-ui/react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { FaChartBar, FaChartLine } from 'react-icons/fa';

export default function GraficoClientesAtivadosComparativo() {
  const [dados, setDados] = useState([]);
  const [tempoRestante, setTempoRestante] = useState(300);
  const [modo, setModo] = useState('barra');
  const [mostrarCard, setMostrarCard] = useState(false);
  const [nomesBloqueados, setNomesBloqueados] = useState([]); // Changed to store names instead of IDs

  const corAtivado = useColorModeValue('#3182ce', '#63b3ed');
  const corBloqueado = useColorModeValue('#e53e3e', '#fc8181');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all required data
        const [mesAtivacaoRes, bloqueadosRes, ativadosRes] = await Promise.all([
          fetch('https://apidoixc.nexusnerds.com.br/Data/Mês_AtivaçãoCliente.json').then(r => r.json()),
          fetch('https://apidoixc.nexusnerds.com.br/data/ClientesBloquados.json').then(r => r.json()),
          fetch('https://apidoixc.nexusnerds.com.br/data/Clientes_ativados.json').then(r => r.json())
        ]);

        const clientes = mesAtivacaoRes.clientes || [];
        const bloqueados = bloqueadosRes || [];
        const ativados = ativadosRes || [];

        // Create a map of blocked client IDs to their names
        const bloqueadosMap = new Map(bloqueados.map(b => [b.id_cliente, b.razao]));

        // Get current and previous month for comparison
        const agora = new Date(); // April 27, 2025
        const anoAtual = agora.getFullYear(); // 2025
        const mesAtual = agora.getMonth(); // 3 (April)

        // Calculate activated and blocked counts using Mês_AtivaçãoCliente.json
        const passadoAtivados = clientes.filter(c => c.mes_ativacao === 'Mês Passado').length;
        const passadoBloqueados = clientes.filter(c => c.mes_ativacao === 'Mês Passado' && c.bloqueado === 'Sim').length;
        const atualAtivados = clientes.filter(c => c.mes_ativacao === 'Neste Mês').length;
        const atualBloqueados = clientes.filter(c => c.mes_ativacao === 'Neste Mês' && c.bloqueado === 'Sim').length;

        // Use Clientes_ativados.json to identify blocked clients by ID and activation date
        const bloqueadosAtuais = ativados
          .filter(cliente => {
            const data = new Date(cliente.data_ativacao);
            const ano = data.getFullYear();
            const mes = data.getMonth();
            // Check if activated in the current month (April 2025)
            const isCurrentMonth = ano === anoAtual && mes === mesAtual;
            // Check if the client is blocked
            const isBloqueado = bloqueadosMap.has(cliente.id_cliente);
            return isCurrentMonth && isBloqueado;
          })
          .map(cliente => ({
            id: cliente.id_cliente,
            nome: bloqueadosMap.get(cliente.id_cliente) || 'Nome não encontrado'
          }));

        const bloqueadosPassados = ativados
          .filter(cliente => {
            const data = new Date(cliente.data_ativacao);
            const ano = data.getFullYear();
            const mes = data.getMonth();
            // Check if activated in the previous month (March 2025)
            const isPreviousMonth =
              (ano === anoAtual && mes === mesAtual - 1) ||
              (mesAtual === 0 && ano === anoAtual - 1 && mes === 11);
            const isBloqueado = bloqueadosMap.has(cliente.id_cliente);
            return isPreviousMonth && isBloqueado;
          })
          .map(cliente => ({
            id: cliente.id_cliente,
            nome: bloqueadosMap.get(cliente.id_cliente) || 'Nome não encontrado'
          }));

        // Set the data for the chart
        setDados([
          {
            mes: 'Mês Passado',
            ativados: passadoAtivados,
            bloqueados: passadoBloqueados,
            blockedClients: bloqueadosPassados // Store blocked clients with names
          },
          {
            mes: 'Mês Atual',
            ativados: atualAtivados,
            bloqueados: atualBloqueados,
            blockedClients: bloqueadosAtuais // Store blocked clients with names
          }
        ]);

        // Set the names of blocked clients for the current month to display in the card
        setNomesBloqueados(bloqueadosAtuais.map(b => b.nome));
      } catch (err) {
        console.error('Erro ao buscar dados do gráfico:', err);
      }

      // Always reset the timer, with or without error
      setTempoRestante(300);
    }

    fetchData();
    const id = setInterval(fetchData, 300000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTempoRestante(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (mostrarCard) {
      const timeout = setTimeout(() => setMostrarCard(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [mostrarCard]);

  const bg = useColorModeValue('white', 'gray.700');
  const text = useColorModeValue('black', 'white');
  const azul = useColorModeValue('#3182ce', '#90cdf4');
  const vermelho = useColorModeValue('#e53e3e', '#feb2b2');

  function CustomTooltip({ active, payload, label, onClick }) {
    if (active && payload?.length) {
      const dadosMes = payload[0].payload;
      const blockedClients = dadosMes?.blockedClients || [];

      return (
        <Box
          bg={bg}
          color={text}
          p={3}
          borderRadius="md"
          boxShadow="md"
          onClick={() => {
            onClick?.(blockedClients); // Pass the blocked clients to the onClick handler
          }}
        >
          <Text fontWeight="bold" mb={1}>{label}</Text>
          <Text color={azul}>Ativados: {dadosMes.ativados}</Text>
          <Text color={vermelho}>Bloqueados: {dadosMes.bloqueados}</Text>
        </Box>
      );
    }

    return null;
  }

  return (
<Box
  w="100%"
  p={4}
  bg="whiteAlpha.100"
  borderRadius="md"
  boxShadow="md"
>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Comparativo de Clientes Ativados</Heading>
        <ChakraTooltip label={`Visualização: ${modo === 'barra' ? 'Coluna' : 'Linha'}`}>
          <IconButton
            icon={modo === 'barra' ? <FaChartLine /> : <FaChartBar />}
            onClick={() => setModo(modo === 'barra' ? 'linha' : 'barra')}
            aria-label="Alternar visualização"
            size="sm"
            variant="outline"
            isRound
            borderColor={useColorModeValue('gray.200', 'gray.600')}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
          />
        </ChakraTooltip>
      </Box>

      <ResponsiveContainer width="100%" height={modo === 'barra' ? 260 : 280}>
        {modo === 'barra' ? (
          <BarChart data={dados}>
            <XAxis dataKey="mes" />
            <YAxis allowDecimals={false} />
            <Tooltip content={
              <CustomTooltip onClick={(blockedClients) => {
                setMostrarCard(true);
                setNomesBloqueados(blockedClients.map(b => b.nome));
              }} />
            } />
            <Legend />
            <Bar dataKey="ativados" fill={corAtivado} name="Ativados" />
            <Bar
              dataKey="bloqueados"
              fill={corBloqueado}
              name="Bloqueados"
              onClick={(data) => {
                setNomesBloqueados(data.payload.blockedClients.map(b => b.nome));
                setMostrarCard(true);
              }}
            />
          </BarChart>
        ) : (
          <LineChart data={dados}>
            <XAxis dataKey="mes" />
            <YAxis allowDecimals={false} />
            <Tooltip content={
              <CustomTooltip onClick={(blockedClients) => {
                setMostrarCard(true);
                setNomesBloqueados(blockedClients.map(b => b.nome));
              }} />
            } />
            <Legend />
            <Line type="monotone" dataKey="ativados" stroke={corAtivado} name="Ativados" />
            <Line type="monotone" dataKey="bloqueados" stroke={corBloqueado} name="Bloqueados" />
          </LineChart>
        )}
      </ResponsiveContainer>

      <Text mt={4} textAlign="center" fontSize="sm" color="gray.500">
        Atualização em {Math.floor(tempoRestante / 60)}:{String(tempoRestante % 60).padStart(2, '0')} min
      </Text>

      {mostrarCard && (
        <Box mt={4} p={4} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="md" boxShadow="md">
          <Text fontWeight="bold" mb={2}>Clientes Bloqueados</Text>
          {nomesBloqueados.length > 0 ? (
            nomesBloqueados.map((nome, i) => (
              <Text key={i} fontSize="sm">• {nome}</Text>
            ))
          ) : (
            <Text fontSize="sm">Nenhum cliente bloqueado encontrado.</Text>
          )}
        </Box>
      )}
    </Box>
  );
}