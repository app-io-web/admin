import { useState, useEffect } from 'react';
import {
  Box, Heading, SimpleGrid, Button, useToast, Spinner, VStack, HStack, Text, Tag, TagLabel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Input, NumberInput, NumberInputField
} from '@chakra-ui/react';

export default function ConfigCupomDesconto() {
  const [cupons, setCupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const toast = useToast();

  const fetchCupons = async () => {
    try {
      const res = await fetch('https://api.configsite.nexusnerds.com.br/cupom-desconto-ficha');
      const data = await res.json();
      setCupons(data.list || []);
    } catch (err) {
      toast({ title: 'Erro ao buscar cupons', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCupons(); }, []);

  const salvar = async () => {
    try {
      const payload = {
        CUPPOM: editando.CUPPOM,
        DESCONTO: editando.DESCONTO,
        VALIDADE: editando.VALIDADE || null
      };
      const url = editando.Id ? `https://api.configsite.nexusnerds.com.br/cupom-desconto-ficha/${editando.Id}` : 'https://api.configsite.nexusnerds.com.br/cupom-desconto-ficha';
      const method = editando.Id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editando.Id ? [payload] : payload),
      });
      if (res.ok) {
        toast({ title: 'Cupom salvo!', status: 'success' });
        setIsOpen(false);
        fetchCupons();
      } else {
        toast({ title: 'Erro ao salvar', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Falha ao salvar', status: 'error' });
    }
  };

  const deletar = async (id) => {
    try {
      const res = await fetch(`https://api.configsite.nexusnerds.com.br/cupom-desconto-ficha/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Cupom deletado!', status: 'success' });
        fetchCupons();
      } else {
        toast({ title: 'Erro ao deletar', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Falha ao deletar', status: 'error' });
    }
  };

  const abrirModal = (cupom = null) => {
    if (cupom) {
      setEditando({ ...cupom });
    } else {
      setEditando({ CUPPOM: '', DESCONTO: '', VALIDADE: '' });
    }
    setIsOpen(true);
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <Box>
      <Heading size="md" mb={4}>Cupons de Desconto</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
        {cupons.map((cupom) => (
          <Box key={cupom.Id} p={4} borderWidth="1px" borderRadius="md">
            <Heading size="sm">{cupom.CUPPOM}</Heading>
            <HStack mt={2}>
              <Tag colorScheme="green"><TagLabel>{cupom.DESCONTO}%</TagLabel></Tag>
              {cupom.VALIDADE && <Tag colorScheme="blue"><TagLabel>Validade: {cupom.VALIDADE}</TagLabel></Tag>}
            </HStack>
            <HStack mt={3}>
              <Button size="sm" onClick={() => abrirModal(cupom)}>Editar</Button>
              <Button size="sm" colorScheme="red" onClick={() => deletar(cupom.Id || cupom.id)}>Deletar</Button>
              </HStack>
          </Box>
        ))}
      </SimpleGrid>
      <Button colorScheme="blue" onClick={() => abrirModal()}>Adicionar Cupom</Button>

      {isOpen && (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>{editando.Id ? 'Editar Cupom' : 'Novo Cupom'}</ModalHeader>
    <ModalCloseButton />
    <ModalBody>
      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontWeight="bold" mb={1}>Nome do Cupom</Text>
          <Input
            placeholder="Ex: BLACKFRIDAY"
            value={editando.CUPPOM}
            onChange={(e) => setEditando({ ...editando, CUPPOM: e.target.value })}
          />
        </Box>
        <Box>
          <Text fontWeight="bold" mb={1}>Desconto (%)</Text>
          <NumberInput min={1} max={100} value={editando.DESCONTO} onChange={(value) => setEditando({ ...editando, DESCONTO: value })}>
            <NumberInputField placeholder="Porcentagem de desconto" />
          </NumberInput>
        </Box>
        <Box>
          <Text fontWeight="bold" mb={1}>Validade</Text>
          <Input
            type="date"
            value={editando.VALIDADE || ''}
            onChange={(e) => setEditando({ ...editando, VALIDADE: e.target.value })}
          />
        </Box>
      </VStack>
    </ModalBody>
    <ModalFooter>
      <Button colorScheme="green" onClick={salvar}>Salvar</Button>
    </ModalFooter>
  </ModalContent>
</Modal>

      )}
    </Box>
  );
}
