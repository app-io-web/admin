import { useState, useEffect } from 'react';
import { Box, Heading, Input, Button, useToast, VStack, Spinner, HStack, Icon } from '@chakra-ui/react';
import { Phone } from 'lucide-react';

export default function ConfigNumeroTelefone() {
  const [numero, setNumero] = useState('');
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchNumero = async () => {
    try {
      const res = await fetch('https://api.configsite.nexusnerds.com.br/numero-de-telefone-site');
      const data = await res.json();
      const registro = data.list?.[0];  // 🔥 Corrigido aqui
      if (registro) {
        setNumero(registro.Numero || '');
        setRecordId(registro.Id);
      }
    } catch (err) {
      toast({ title: 'Erro ao buscar número', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNumero(); }, []);

  const salvar = async () => {
    try {
      const res = await fetch(`https://api.configsite.nexusnerds.com.br/numero-de-telefone-site`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ Id: recordId, Numero: numero }]),
      });
      if (res.ok) {
        toast({ title: 'Número atualizado!', status: 'success' });
      } else {
        toast({ title: 'Erro ao salvar', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Falha ao salvar', status: 'error' });
    }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <Box mb={8}>
      <Heading size="md" mb={4}>Número de Telefone</Heading>
      <VStack spacing={3} align="flex-start" w="100%">
        <HStack w="100%">
          <Icon as={Phone} color="green.500" />
          <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="(XX) XXXXX-XXXX" />
        </HStack>
        <Button colorScheme="blue" onClick={salvar}>Salvar</Button>
      </VStack>
    </Box>
  );
}
