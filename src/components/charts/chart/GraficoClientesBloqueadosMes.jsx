//UTILIZAR ESSE LINK PARA FETCH          https://apidoixc.nexusnerds.com.br/Data/Clientes_ativados.json

/*
EXEMPLO DE JSON

[
  {
    "data_ativacao": "2025-04-02",
    "status": "Mês Passado",
    "id_cliente": "1387"
  },
  {
    "data_ativacao": "2025-04-01",
    "status": "Neste Mês",
    "id_cliente": "782"
  },

]
*/


// src/components/charts/GraficoClientesBloqueadosMes.jsx
import { useEffect, useState } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GraficoClientesBloqueadosMes() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const res = await fetch('https://apidoixc.nexusnerds.com.br/data/ClientesBloquados.json');
        const json = await res.json();

        const resumo = {
          'Mês Passado': 0,
          'Neste Mês': 0
        };

        json.forEach(item => {
          if (item.status === 'Mês Passado') resumo['Mês Passado'] += 1;
          if (item.status === 'Neste Mês') resumo['Neste Mês'] += 1;
        });

        const resultado = Object.entries(resumo).map(([status, total]) => ({
          status,
          total
        }));

        setDados(resultado);
      } catch (error) {
        console.error('Erro ao buscar clientes bloqueados:', error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDados();
  }, []);

  return (
    <Box p={4} bg="whiteAlpha.100" borderRadius="md" boxShadow="md">
      <Text fontSize="lg" fontWeight="bold" mb={4}>Clientes Bloqueados por Mês</Text>
      {carregando ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#e53e3e" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
