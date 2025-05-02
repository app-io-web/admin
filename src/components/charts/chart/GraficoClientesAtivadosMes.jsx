//UTILIZAR ESSE LINK PARA FETCH          https://apidoixc.nexusnerds.com.br/Data/ClientesBloquados.json

/*


[
  {
    "id_cliente": "140",
    "razao": "LUCAS VIEIRA SOUZA",
    "endereco": "Av Guarapari",
    "telefone_celular": "(22) 99908-2174",
    "telefone_comercial": ""
  },
]




*/




// src/components/charts/GraficoClientesAtivadosMes.jsx
import { useEffect, useState } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GraficoClientesAtivadosMes() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const res = await fetch('https://apidoixc.nexusnerds.com.br/data/Clientes_ativados.json');
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
        console.error('Erro ao buscar clientes ativados:', error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDados();
  }, []);

  return (
    <Box w="100%" p={4} bg="whiteAlpha.100" borderRadius="md" boxShadow="md">
      <Text fontSize="lg" fontWeight="bold" mb={4}>Clientes Ativados por Mês</Text>
      {carregando ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#3182ce" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
