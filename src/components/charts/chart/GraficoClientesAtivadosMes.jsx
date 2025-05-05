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
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function GraficoComparacaoClientes() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarDados = async () => {
      try {
        // Fetch dos clientes ativados
        const resAtivados = await fetch('https://apidoixc.nexusnerds.com.br/data/Clientes_ativados.json');
        const jsonAtivados = await resAtivados.json();

        // Fetch dos clientes bloqueados
        const resBloqueados = await fetch('https://apidoixc.nexusnerds.com.br/Data/ClientesBloquados.json');
        const jsonBloqueados = await resBloqueados.json();

        // Contar o total de clientes ativados (sem distinguir por status)
        const totalAtivados = jsonAtivados.length;

        // Contar o total de clientes bloqueados
        const totalBloqueados = jsonBloqueados.length;

        // Preparar os dados para o gráfico de donut
        const resultado = [
          { name: 'Ativados', value: totalAtivados },
          { name: 'Bloqueados', value: totalBloqueados },
        ];

        setDados(resultado);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setCarregando(false);
      }
    };

    buscarDados();
  }, []);

  // Definir cores para o gráfico de donut
  const COLORS = ['#3182ce', '#ff6b6b']; // Azul para ativados, vermelho para bloqueados

  return (
    <Box w="100%" p={4} bg="whiteAlpha.100" borderRadius="md" boxShadow="md">
      <Text fontSize="lg" fontWeight="bold" mb={4}>Comparação: Clientes Ativados vs Bloqueados</Text>
      {carregando ? (
        <Spinner />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={dados}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60} // Cria o "buraco" do donut
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
            >
              {dados.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#333', borderRadius: '5px' }}
              labelStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
