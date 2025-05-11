// src/components/relatorios/RelatorioVendedoresLista.jsx
import {
  Box, Heading, VStack, Button, SimpleGrid, Spinner, Icon, Text, Flex
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers } from 'react-icons/fi';
import { MdBarChart } from 'react-icons/md';

export default function RelatorioVendedoresLista() {
  const [vendedores, setVendedores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const buscarVendedores = async () => {
      try {
        const res = await fetch('https://max.api.email.nexusnerds.com.br/api/vendedores');
        const json = await res.json();
        setVendedores(json);
      } catch (e) {
        console.error('Erro ao buscar vendedores', e);
      } finally {
        setCarregando(false);
      }
    };
    buscarVendedores();
  }, []);

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Relatório de Vendas - Vendedores</Heading>

      {carregando ? (
        <Spinner size="lg" />
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={6}>
          <Button
            onClick={() => navigate(`/relatorios/vendas/geral`)}
            leftIcon={<MdBarChart />}
            colorScheme="blue"
            variant="solid"
            size="lg"
            shadow="md"
          >
            Relatório Geral
          </Button>

          {vendedores.map((v) => (
            <Button
              key={v.vendedor}
              onClick={() => navigate(`/relatorios/vendas/${v.vendedor}`)}
              leftIcon={<FiUsers />}
              colorScheme="teal"
              variant="outline"
              size="lg"
              shadow="sm"
            >
              {v.vendedor}
            </Button>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}