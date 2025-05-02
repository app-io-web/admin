import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, useColorModeValue, Spinner
} from '@chakra-ui/react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';

export default function GraficoComparativoClientesVir() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  const corAtivo = useColorModeValue('#38A169', '#48BB78');
  const corBloqueado = useColorModeValue('#E53E3E', '#FC8181');
  const bg = useColorModeValue('white', 'gray.800');
  const tooltipBg = useColorModeValue('white', 'gray.700');
  const tooltipColor = useColorModeValue('black', 'white');

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const [resAtivos, resBloqueados] = await Promise.all([
          fetch('https://apidoixc.nexusnerds.com.br/data/clientes_ativosVIR.json').then(r => r.json()),
          fetch('https://apidoixc.nexusnerds.com.br/data/clientes_bloqueados_atualizado.json').then(r => r.json())
        ]);

        const totalAtivos = resAtivos?.quantidade || 0;
        const totalBloqueados = resBloqueados?.quantidade || 0;

        setDados([
          {
            nome: 'VIR TELECOM',
            ativos: totalAtivos,
            bloqueados: totalBloqueados
          }
        ]);
      } catch (err) {
        console.error('Erro ao buscar dados da VIR TELECOM:', err);
      } finally {
        setLoading(false);
      }
    };

    buscarDados(); // Executa imediatamente

    const interval = setInterval(buscarDados, 300000); // Atualiza a cada 5 minutos

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <Box bg={tooltipBg} color={tooltipColor} p={3} borderRadius="md" boxShadow="md">
          <Text fontWeight="bold" mb={1}>{label}</Text>
          <Text color={corAtivo}>Ativos: {payload[0].payload.ativos}</Text>
          <Text color={corBloqueado}>Bloqueados: {payload[0].payload.bloqueados}</Text>
        </Box>
      );
    }
    return null;
  };

  

  return (
    <Box
      w="100%"
      p={4}
      bg="whiteAlpha.100"
      borderRadius="md"
      boxShadow="md"
    >
      <Heading size="md" mb={4}>Comparativo de Clientes - VIR TELECOM</Heading>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dados}>
              <XAxis dataKey="nome" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="ativos" fill={corAtivo} name="Ativos" />
              <Bar dataKey="bloqueados" fill={corBloqueado} name="Bloqueados" />
            </BarChart>
          </ResponsiveContainer>

          <Text mt={4} textAlign="center" fontSize="sm" color="gray.500">
            {dados[0]?.ativos} ativos • {dados[0]?.bloqueados} bloqueados
          </Text>
        </>
      )}
    </Box>
  );
}
