import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, useColorModeValue, Spinner
} from '@chakra-ui/react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

import dayjs from 'dayjs'; // 📦 use "dayjs" para facilitar datas

export default function GraficoCanceladosVirTimeline() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  const corLinha = useColorModeValue('#ED8936', '#F6AD55');
  const bg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const buscarDados = () => {
      fetch('https://apidoixc.nexusnerds.com.br/data/clientes_canceladosVIR.json')
        .then(res => res.json())
        .then(json => {
          const clientes = json?.clientes || [];
  
          const hoje = dayjs();
  
          const agrupado = {};
          clientes.forEach(cliente => {
            const data = dayjs(cliente.DATA_TERMINO);
            if (data.isAfter(hoje)) return; // 👈 descarta datas futuras
  
            const key = data.format('MM/YYYY');
            agrupado[key] = (agrupado[key] || 0) + 1;
          });
  
          const resultado = Object.entries(agrupado)
            .map(([mesAno, total]) => ({ mesAno, total }))
            .sort((a, b) => {
              const [ma, aa] = a.mesAno.split('/');
              const [mb, ab] = b.mesAno.split('/');
              return new Date(`${aa}-${ma}`) - new Date(`${ab}-${mb}`);
            });
  
          setDados(resultado);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
  
    buscarDados();
    const interval = setInterval(buscarDados, 300000);
    return () => clearInterval(interval);
  }, []);
  


  function CustomTooltip({ active, payload, label }) {
    const bg = useColorModeValue('white', 'gray.700');
    const color = useColorModeValue('black', 'white');
  
    if (active && payload && payload.length) {
      return (
        <Box bg={bg} color={color} p={3} borderRadius="md" boxShadow="md">
          <Text fontWeight="bold" mb={1}>{label}</Text>
          <Text>Cancelamentos: {payload[0].value}</Text>
        </Box>
      );
    }
  
    return null;
  }

  return (
    <Box
      w={{ base: '90vw', md: '400px' }}
      maxW="100%"
      mx="auto"
      p={{ base: 4, md: 6 }}
      borderRadius="2xl"
      boxShadow="md"
      bg={bg}
      mt={4}
    >
      <Heading size="md" mb={4}>Cancelamentos - VIR TELECOM</Heading>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mesAno" />
              <YAxis allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />

              <Line type="monotone" dataKey="total" stroke={corLinha} name="Cancelamentos" />
            </LineChart>
          </ResponsiveContainer>

          <Text mt={4} textAlign="center" fontSize="sm" color="gray.500">
            Total: {dados.reduce((acc, cur) => acc + cur.total, 0)} cancelados
          </Text>
        </>
      )}
    </Box>
  );
}
