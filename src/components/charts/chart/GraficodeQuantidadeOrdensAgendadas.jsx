import { useEffect, useState } from 'react';
import { Box, Spinner, Text, useColorModeValue } from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function GraficodeQuantidadeOrdensAgendadas() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const res = await fetch('https://apidoixc.nexusnerds.com.br/data/Ordens_Agendadas.json');
        const json = await res.json();

        const contagem = {};

        json.forEach(item => {
          const assunto = item.assunto?.trim() || 'Sem Assunto';
          contagem[assunto] = (contagem[assunto] || 0) + 1;
        });

        const resultado = Object.entries(contagem).map(([assunto, total]) => ({
          assunto,
          assuntoCurto: assunto.length > 20 ? assunto.slice(0, 20) + '...' : assunto,
          total,
        }));

        setDados(resultado);
      } catch (error) {
        console.error('Erro ao buscar ordens agendadas:', error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDados();
  }, []);

  const tooltipBg = useColorModeValue('#ffffff', '#1A202C');

  return (
    <Box w="100%" p={4} bg="whiteAlpha.100" borderRadius="md" boxShadow="md">
      <Text fontSize="lg" fontWeight="bold" mb={4}>Ordens Agendadas por Assunto</Text>
      {carregando ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dados} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="assuntoCurto" type="category" width={150} />
            <Tooltip
              contentStyle={{ backgroundColor: tooltipBg }}
              formatter={(value, name, props) => [`${value} ordens`, 'Total']}
              labelFormatter={(label, payload) =>
                payload?.[0]?.payload?.assunto || label
              }
            />
            <Bar dataKey="total" fill="#3182ce" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
