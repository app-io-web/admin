import { useState, useEffect } from 'react';
import { Box, Heading, Input, Button, useToast, VStack, Spinner, HStack, Icon } from '@chakra-ui/react';
import { Instagram, Youtube, Facebook } from 'lucide-react';

export default function ConfigRedesSociais() {
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [facebook, setFacebook] = useState('');
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchRedes = async () => {
    try {
      const res = await fetch('https://api.configsite.nexusnerds.com.br/redes-sociais');
      const data = await res.json();
      const registro = data.list?.[0]; // 🔥 corrigido aqui
      if (registro) {
        setInstagram(registro.Instagram || '');
        setYoutube(registro.Youtube || '');
        setFacebook(registro.Facebook || '');
        setRecordId(registro.Id);
      }
    } catch (err) {
      toast({ title: 'Erro ao buscar redes sociais', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRedes(); }, []);

  const salvar = async () => {
    try {
      const res = await fetch(`https://api.configsite.nexusnerds.com.br/redes-sociais`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ Id: recordId, Instagram: instagram, Youtube: youtube, Facebook: facebook }]),
      });
      if (res.ok) {
        toast({ title: 'Redes sociais atualizadas!', status: 'success' });
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
      <Heading size="md" mb={4}>Redes Sociais</Heading>
      <VStack spacing={3} align="flex-start" w="100%">
        <HStack w="100%">
          <Icon as={Instagram} color="pink.400" />
          <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram" />
        </HStack>
        <HStack w="100%">
          <Icon as={Youtube} color="red.500" />
          <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="YouTube" />
        </HStack>
        <HStack w="100%">
          <Icon as={Facebook} color="blue.500" />
          <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook" />
        </HStack>
        <Button colorScheme="blue" onClick={salvar}>Salvar</Button>
      </VStack>
    </Box>
  );
}
