import { useState } from 'react';
import {
  Box, Heading, SimpleGrid, Input, Text, VStack, Divider, Button, useToast
} from '@chakra-ui/react';

export default function FechamentoDiario() {
  const [valores, setValores] = useState({
    moedas: { 1: 0, 0.5: 0, 0.25: 0 },
    caixaFrente: { 20: 0, 10: 0, 5: 0, 2: 0 },
    caixaInterno: { 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0 },
  });
  const [carregando, setCarregando] = useState(false);
  const toast = useToast();

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {};
  const unicID_user = usuario?.idUnico || 'desconhecido';
  const dataHoje = new Date().toISOString().split('T')[0];

  const calcularTotal = () => {
    const somarCategoria = (categoria) =>
      Object.entries(categoria).reduce((acc, [valor, qtd]) => acc + (valor * qtd), 0);
    return somarCategoria(valores.moedas) + somarCategoria(valores.caixaFrente) + somarCategoria(valores.caixaInterno);
  };

  const handleChange = (categoria, valor, qtd) => {
    setValores((prev) => ({
      ...prev,
      [categoria]: { ...prev[categoria], [valor]: qtd },
    }));
  };

  const enviarFechamento = async () => {
    setCarregando(true);
    try {
      const response = await fetch('https://api.fechamentodiario.nexusnerds.com.br/fechamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unicID_user,
          Data: dataHoje,
          fechamento_diario: valores
        }),
      });
      const resJson = await response.json();
      if (response.ok) {
        toast({
          title: 'Fechamento enviado!',
          description: resJson.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(resJson.error || 'Erro ao enviar fechamento.');
      }
    } catch (err) {
      console.error('Erro ao enviar fechamento:', err);
      toast({
        title: 'Erro ao enviar',
        description: err.message || 'Tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <VStack spacing={6} align="stretch" p={4} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="md" boxShadow="md">
      <Heading size="md">Fechamento Diário - Moedas e Notas</Heading>

      {/* Moedas */}
      <Box>
        <Text fontWeight="bold" mb={2}>Moedas</Text>
        <SimpleGrid columns={3} spacing={2}>
          {[1, 0.5, 0.25].map((valor) => (
            <Box key={valor}>
              <Text>R$ {valor.toFixed(2)}</Text>
              <Input
                type="number"
                placeholder="Quantidade"
                value={valores.moedas[valor]}
                onChange={(e) => handleChange('moedas', valor, parseInt(e.target.value) || 0)}
              />
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Divider />

      {/* Caixa Frente */}
      <Box>
        <Text fontWeight="bold" mb={2}>Notas - Caixa Frente</Text>
        <SimpleGrid columns={2} spacing={2}>
          {[20, 10, 5, 2].map((valor) => (
            <Box key={valor}>
              <Text>R$ {valor.toFixed(2)}</Text>
              <Input
                type="number"
                placeholder="Quantidade"
                value={valores.caixaFrente[valor]}
                onChange={(e) => handleChange('caixaFrente', valor, parseInt(e.target.value) || 0)}
              />
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Divider />

      {/* Caixa Interno */}
      <Box>
        <Text fontWeight="bold" mb={2}>Notas - Caixa Interno</Text>
        <SimpleGrid columns={2} spacing={2}>
          {[100, 50, 20, 10, 5, 2].map((valor) => (
            <Box key={valor}>
              <Text>R$ {valor.toFixed(2)}</Text>
              <Input
                type="number"
                placeholder="Quantidade"
                value={valores.caixaInterno[valor]}
                onChange={(e) => handleChange('caixaInterno', valor, parseInt(e.target.value) || 0)}
              />
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Divider />


        {/* Total Geral */}
        <Box p={3} bg="gray.100" _dark={{ bg: 'gray.600' }} borderRadius="md" textAlign="center">
        <Text fontWeight="bold">Total Geral</Text>
        <Text fontSize="xl">R$ {calcularTotal().toFixed(2)}</Text>
        
        {/* Data e Hora */}
        <Text mt={2} fontSize="sm" color="gray.500">
            {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        </Box>


      {/* Botão Enviar */}
      <Button colorScheme="blue" onClick={enviarFechamento} isLoading={carregando}>
        Enviar Fechamento
      </Button>
    </VStack>
  );
}
