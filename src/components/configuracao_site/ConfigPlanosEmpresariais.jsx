import { useState, useEffect } from 'react';
import { Box, Text, VStack, Button, Input, SimpleGrid, useToast } from '@chakra-ui/react';

export default function ConfigPlanosEmpresariais() {
  const [planos, setPlanos] = useState({
    Plano_Startup: {},
    Plano_Medium: {},
    Plano_Big: {}
  });
  const toast = useToast();

  const fetchPlanos = async () => {
    try {
      const res = await fetch('https://api.configsite.nexusnerds.com.br/planos-empresariais');
      const data = await res.json();
      const registro = data.list?.[0];  // <-- AJUSTA PARA list
      console.log('Dados recebidos:', data);
      console.log('Primeiro registro:', registro);
      if (!registro) return;

      setPlanos({
        Plano_Startup: registro.Plano_Startup, // já é objeto
        Plano_Medium: registro.Plano_Medium,
        Plano_Big: registro.Plano_Big,
        Id: registro.Id
      });
      
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
    }
  };

  useEffect(() => {
    fetchPlanos();
  }, []);

  const handleChange = (plano, field, value) => {
    setPlanos((prev) => ({
      ...prev,
      [plano]: {
        ...prev[plano],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (plano) => {
    try {
      const body = {
        Id: planos.Id,
        [`${plano}`]: JSON.stringify(planos[plano])
      };

      const res = await fetch('https://api.configsite.nexusnerds.com.br/planos-empresariais', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast({ title: 'Plano atualizado com sucesso', status: 'success', duration: 3000, isClosable: true });
        fetchPlanos();
      } else {
        throw new Error('Erro ao atualizar plano');
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const campos = ['Tecnologia', 'Moldem', 'Valor', 'Tempo_de_SLA', 'Suporte'];

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
      {['Plano_Startup', 'Plano_Medium', 'Plano_Big'].map((plano) => (
        <Box key={plano} p={4} borderWidth="1px" borderRadius="md">
          <Text fontSize="lg" mb={2}>{plano.replace('Plano_', 'Plano ')}</Text>
          <VStack spacing={2} align="stretch">
            {campos.map((campo) => (
              <Box key={campo}>
                <Text fontSize="sm">{campo}</Text>
                <Input
                  value={planos[plano]?.[campo] || ''}
                  onChange={(e) => handleChange(plano, campo, e.target.value)}
                />
              </Box>
            ))}
            <Button colorScheme="blue" onClick={() => handleSubmit(plano)}>Salvar</Button>
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  );
}
