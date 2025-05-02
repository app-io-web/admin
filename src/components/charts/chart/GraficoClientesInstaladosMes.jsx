//UTILIZAR ESSE LINK PARA FETCH           https://apidoixc.nexusnerds.com.br/Data/Mês_AtivaçãoCliente.json
/* 
EXEMPLO DE JSON


{
  "total_geral": 22,
  "total_mes_passado": 22,
  "total_este_mes": 0,
  "clientes": [
    {
      "data_ativacao": "2025-04-02",
      "mes_ativacao": "Mês Passado",
      "nome_cliente": "Washington Taveira Delfino",
      "vendedor_responsavel": "Tatiara Kister",
      "bloqueado": "Não"
    },

}

*/


// src/components/charts/GraficoClientesInstaladosMes.jsx
import { useEffect, useState } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GraficoClientesInstaladosMes() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        const res = await fetch('https://apidoixc.nexusnerds.com.br/Data/Mês_AtivaçãoCliente.json');
        const json = await res.json();

        const resultado = [
          { status: 'Mês Passado', total: json.total_mes_passado || 0 },
          { status: 'Neste Mês', total: json.total_este_mes || 0 },
        ];

        setDados(resultado);
      } catch (error) {
        console.error('Erro ao buscar clientes instalados:', error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDados();
  }, []);

  return (
<Box w="100%" p={4} bg="whiteAlpha.100" borderRadius="md" boxShadow="md">
<Text fontSize="lg" fontWeight="bold" mb={4}>Clientes Instalados por Mês</Text>
      {carregando ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#38a169" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}

