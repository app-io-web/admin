//https://apidoixc.nexusnerds.com.br/data/Ordens_Agendadas.json 

/*
EXEMPLO DE JSON
[
  {
    "setor": "Setor Desconhecido",
    "status": "Agendados",
    "id_tecnico": "22",
    "tecnico": "ISAQUE CAMILO DE OLIVEIRA",
    "id_cliente": "1260",
    "razao": "Malu Noronha Jeronimo",
    "telefone_celular": "(72) 99874-8746",
    "endereco": "ES Viana 29138-028 NOVA BETANHIA - Rua rio Araguaia, 1",
    "data_abertura": "2025-03-06 14:57:18",
    "data_final": "Não especificada",
    "assunto": "Cancelamento - Recolhimento  ",
    "hoje": false,
    "finalizadoMesPassado": false,
    "finalizadoAnoPassado": false
  },

]

*/




// src/components/charts/GraficodeQuantidadeOrdensAgendadas.jsx
import { useEffect, useState } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
          total
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

  return (
    <Box w="100%" p={4} bg="whiteAlpha.100" borderRadius="md" boxShadow="md">
      <Text fontSize="lg" fontWeight="bold" mb={4}>Ordens Agendadas por Assunto</Text>
      {carregando ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dados} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="assunto" type="category" />
            <Tooltip />
            <Bar dataKey="total" fill="#4299e1" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
