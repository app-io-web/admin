import { useState, useEffect } from 'react';
import {
  Box, Heading, SimpleGrid, Button, useToast, Spinner, VStack, HStack, Text, Switch, Tag, TagLabel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Input, Select
} from '@chakra-ui/react';

export default function ConfigVendedores() {
  const [vendedores, setVendedores] = useState({});
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const toast = useToast();

  const fetchVendedores = async () => {
    try {
      const res = await fetch('https://api.configsite.nexusnerds.com.br/vendedor');
      const data = await res.json();
      const registro = data.list?.[0];
      if (registro) {
        setVendedores(registro.Vendedor || {});
        setRecordId(registro.Id);
      }
    } catch (err) {
      toast({ title: 'Erro ao buscar vendedores', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendedores(); }, []);

  const salvar = async (dadosParaSalvar = vendedores) => {
    try {
      const payload = { Id: recordId, Vendedor: dadosParaSalvar };
      console.log('📦 Payload enviado:', payload);
      const res = await fetch('https://api.configsite.nexusnerds.com.br/vendedor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([payload]),
      });
      if (res.ok) {
        toast({ title: 'Vendedores atualizados!', status: 'success' });
        setIsOpen(false);
        await fetchVendedores(); // Refaz a busca pra garantir que pegou tudo
      } else {
        const erro = await res.json();
        console.error('❌ Erro ao salvar:', erro);
        toast({ title: 'Erro ao salvar', status: 'error' });
      }
    } catch (err) {
      console.error('❌ Falha no PATCH:', err);
      toast({ title: 'Falha ao salvar', status: 'error' });
    }
  };
  
  
  const abrirModal = (key = null) => {
    if (key) {
      setEditando({ ...vendedores[key], key });
    } else {
      setEditando({ nome: '', telefone: '', email: '', Classificação: 'Ouro', ReceberNotificação: false, Bloqueado: false });
    }
    setIsOpen(true);
  };

  const salvarEdicao = async () => {
    const key = editando.key || `vendedor${Object.keys(vendedores).length + 1}`;
    const novoVendedores = {
      ...vendedores,  // mantém os antigos
      [key]: { ...editando }
    };
    delete novoVendedores[key].key;
  
    setVendedores(novoVendedores);  // Atualiza o state
    await salvar(novoVendedores);   // Envia o merge pro salvar
  };
  
  if (loading) return <Spinner size="lg" />;

  return (
    <Box>
      <Heading size="md" mb={4}>Vendedores</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
        {Object.entries(vendedores).map(([key, vendedor]) => (
          <Box key={key} p={4} borderWidth="1px" borderRadius="md">
            <Heading size="sm">{vendedor.nome}</Heading>
            <Text>Email: {vendedor.email}</Text>
            <Text>Telefone: {vendedor.telefone}</Text>
            <HStack mt={2}>
              <Tag colorScheme="blue"><TagLabel>{vendedor.Classificação}</TagLabel></Tag>
              {vendedor.Bloqueado === 'True' && <Tag colorScheme="red">Bloqueado</Tag>}
              {vendedor.ReceberNotificação === 'True' && <Tag colorScheme="green">Notificação</Tag>}
            </HStack>
            <Button mt={2} size="sm" onClick={() => abrirModal(key)}>Editar</Button>
          </Box>
        ))}
      </SimpleGrid>
      <Button colorScheme="blue" onClick={() => abrirModal()}>Adicionar Vendedor</Button>

      {isOpen && (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{editando.key ? 'Editar' : 'Novo'} Vendedor</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={3}>
                <Input placeholder="Nome" value={editando.nome} onChange={(e) => setEditando({ ...editando, nome: e.target.value })} />
                <Input placeholder="Telefone" value={editando.telefone} onChange={(e) => setEditando({ ...editando, telefone: e.target.value })} />
                <Input placeholder="Email" value={editando.email} onChange={(e) => setEditando({ ...editando, email: e.target.value })} />
                <Select value={editando.Classificação} onChange={(e) => setEditando({ ...editando, Classificação: e.target.value })}>
                  <option value="Diamante">Diamante</option>
                  <option value="Ouro">Ouro</option>
                  <option value="Prata">Prata</option>
                  <option value="Bronze">Bronze</option>
                  <option value="Sem classificação">Sem classificação</option>
                </Select>
                <HStack>
                  <Text>Receber Notificação</Text>
                  <Switch isChecked={editando.ReceberNotificação === 'True'} onChange={(e) => setEditando({ ...editando, ReceberNotificação: e.target.checked ? 'True' : 'False' })} />
                </HStack>
                <HStack>
                  <Text>Bloqueado</Text>
                  <Switch isChecked={editando.Bloqueado === 'True'} onChange={(e) => setEditando({ ...editando, Bloqueado: e.target.checked ? 'True' : 'False' })} />
                </HStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="green" onClick={salvarEdicao}>Salvar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
}
