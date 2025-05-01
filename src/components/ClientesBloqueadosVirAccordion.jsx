import { useEffect, useState } from 'react';
import {
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  Box, Text, useColorModeValue, VStack, HStack, IconButton, Button
} from '@chakra-ui/react';
import { FiUserX } from 'react-icons/fi';

const CLIENTES_POR_PAGINA = 2;

export default function ClientesBloqueadosVirAccordion() {
  const [clientes, setClientes] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(0);

  const bg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const res = await fetch('https://apidoixc.nexusnerds.com.br/data/clientes_bloqueados_atualizado.json');
        const json = await res.json();
        setClientes(json?.clientes || []);
      } catch (err) {
        console.error('Erro ao buscar clientes bloqueados:', err);
      }
    };
  
    // Faz a primeira chamada
    fetchClientes();
  
    // Define intervalo de 5 minutos
    const intervalo = setInterval(fetchClientes, 300000); // 300.000ms = 5min
  
    return () => clearInterval(intervalo); // Limpa quando desmontar
  }, []);
  

  const totalPaginas = Math.ceil(clientes.length / CLIENTES_POR_PAGINA);
  const inicio = paginaAtual * CLIENTES_POR_PAGINA;
  const fim = inicio + CLIENTES_POR_PAGINA;
  const clientesPaginados = clientes.slice(inicio, fim);

  return (
    <Box
      w={{ base: '90vw', md: '400px' }}
      maxW="100%"
      mx="auto"
      mt={4}
      bg={bg}
      p={4}
      borderRadius="xl"
      boxShadow="md"
    >
      <Accordion defaultIndex={[0]}>
        <AccordionItem border="none">
          <AccordionButton>
            <Box flex="1" textAlign="left" display="flex" alignItems="center" gap={2} color={textColor}>
              <FiUserX />
              <Text fontWeight="bold">Clientes Bloqueados - VIR TELECOM</Text>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel>
            <VStack spacing={4} align="stretch">
              {clientesPaginados.map((cliente, index) => (
                <Box key={index} p={3} borderWidth="1px" borderRadius="md">
                  <Text fontWeight="bold">{cliente.RAZAO_SOCIAL}</Text>
                  <Text fontSize="sm" color="gray.500">{cliente.telefone}</Text>
                  <Text fontSize="xs" color="gray.400">Contrato: {cliente.ID_CONTRATO}</Text>
                </Box>
              ))}
            </VStack>

            {totalPaginas > 1 && (
              <HStack justify="center" mt={4}>
                <Button
                  size="sm"
                  onClick={() => setPaginaAtual((p) => Math.max(0, p - 1))}
                  isDisabled={paginaAtual === 0}
                >
                  Anterior
                </Button>
                <Text fontSize="sm">Página {paginaAtual + 1} de {totalPaginas}</Text>
                <Button
                  size="sm"
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas - 1, p + 1))}
                  isDisabled={paginaAtual + 1 >= totalPaginas}
                >
                  Próxima
                </Button>
              </HStack>
            )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );
}
