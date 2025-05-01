import { useState, useEffect } from 'react';
import { Box, Heading, Input, Button, useToast, VStack, Spinner, HStack, Icon } from '@chakra-ui/react';
import { SmartphoneNfc, Apple } from 'lucide-react';

export default function ConfigLinksDownload() {
  const [android, setAndroid] = useState('');
  const [ios, setIos] = useState('');
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchLinks = async () => {
    try {
      const res = await fetch('https://api.configsite.nexusnerds.com.br/links-download');
      const data = await res.json();
      const registro = data.list?.[0];  // 🔥 Corrigido aqui
      if (registro) {
        setAndroid(registro.Android || '');
        setIos(registro.IOS || '');
        setRecordId(registro.Id);
      }
    } catch (err) {
      toast({ title: 'Erro ao buscar links', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const salvar = async () => {
    try {
      const res = await fetch(`https://api.configsite.nexusnerds.com.br/links-download`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ Id: recordId, Android: android, IOS: ios }]),
      });
      if (res.ok) {
        toast({ title: 'Links atualizados!', status: 'success' });
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
      <Heading size="md" mb={4}>Links de Download</Heading>
      <VStack spacing={3} align="flex-start" w="100%">
        <HStack w="100%">
        <Icon as={SmartphoneNfc} color="green.500" />
          <Input value={android} onChange={(e) => setAndroid(e.target.value)} placeholder="Link Android" />
        </HStack>
        <HStack w="100%">
        <Icon as={Apple} color="gray.500" />
          <Input value={ios} onChange={(e) => setIos(e.target.value)} placeholder="Link iOS" />
        </HStack>
        <Button colorScheme="blue" onClick={salvar}>Salvar</Button>
      </VStack>
    </Box>
  );
}
