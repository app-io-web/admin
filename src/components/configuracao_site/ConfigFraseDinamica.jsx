import { useState, useEffect } from 'react';
import {
  Box, Text, VStack, HStack, Button, Input, useDisclosure, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, SimpleGrid, Select
} from '@chakra-ui/react';

export default function ConfigFraseDinamica() {
  const [frases, setFrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editFrase, setEditFrase] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    Part_Frase_Sem_Efeito: '',
    Part_Frase_Com_Efeito: '',
    Efeito: '',
    colorTextAnimado: '',
  });

  const efeitos = [
    'green', 'shadow', 'italic', 'underline', 'big', 'blink',
    'fade', 'pulse', 'slide-left', 'slide-right', 'jump', 'typewriter',
    'shake', 'slow-shake', 'explode', 'flash', 'speed', 'spin'
  ];

  const fetchFrases = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.configsite.nexusnerds.com.br/frase-dinamica');
      const data = await res.json();
      setFrases(data.list || []); // <-- aqui troca pra list
    } catch (err) {
      console.error('Erro ao buscar frases:', err);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchFrases();
  }, []);

  const handleOpenModal = (frase = null) => {
    if (frase) {
      setEditFrase(frase);
      setFormData({
        Part_Frase_Sem_Efeito: frase.Part_Frase_Sem_Efeito || '',
        Part_Frase_Com_Efeito: frase.Part_Frase_Com_Efeito || '',
        Efeito: frase.Efeito || '',
        colorTextAnimado: frase.colorTextAnimado || '',
      });
    } else {
      setEditFrase(null);
      setFormData({
        Part_Frase_Sem_Efeito: '',
        Part_Frase_Com_Efeito: '',
        Efeito: '',
        colorTextAnimado: '',
      });
    }
    onOpen();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const method = editFrase ? 'PATCH' : 'POST';
      const url = 'https://api.configsite.nexusnerds.com.br/frase-dinamica';
      const body = editFrase ? { Id: editFrase.Id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: editFrase ? 'Texto atualizado' : 'Texto adicionado',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchFrases();
        onClose();
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: err.message, status: 'error', duration: 3000 });
    }
  };

  const rgbToHex = (rgb) => {
    if (!rgb) return '#000000'; // padrão
    const result = rgb.match(/\d+/g); // pega os números do rgb()
    if (!result) return '#000000';
    return (
      '#' +
      result.map((x) => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('')
    );
  };
  
  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
  };
  

  return (
    <Box>
      <Button colorScheme="blue" onClick={() => handleOpenModal()}>Adicionar Texto</Button>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
        {loading ? (
          <Text>Carregando...</Text>
        ) : frases.length === 0 ? (
          <Text>Nenhuma frase encontrada.</Text>
        ) : (
          frases.map((frase) => (
            <Box key={frase.Id} p={4} borderWidth="1px" borderRadius="md">
              <Text><strong>Sem Efeito:</strong> {frase.Part_Frase_Sem_Efeito}</Text>
              <Text><strong>Com Efeito:</strong> {frase.Part_Frase_Com_Efeito}</Text>
              <Text><strong>Efeito:</strong> {frase.Efeito}</Text>
              <Text><strong>Cor:</strong> {frase.colorTextAnimado}</Text>
              <Button mt={3} size="sm" colorScheme="yellow" onClick={() => handleOpenModal(frase)}>Editar</Button>
            </Box>
          ))
        )}
      </SimpleGrid>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editFrase ? 'Editar Texto' : 'Adicionar Texto'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box mb={3}>
              <Text fontSize="sm" mb={1}>Parte Sem Efeito</Text>
              <Input value={formData.Part_Frase_Sem_Efeito} onChange={(e) => handleChange('Part_Frase_Sem_Efeito', e.target.value)} />
            </Box>
            <Box mb={3}>
              <Text fontSize="sm" mb={1}>Parte Com Efeito</Text>
              <Input value={formData.Part_Frase_Com_Efeito} onChange={(e) => handleChange('Part_Frase_Com_Efeito', e.target.value)} />
            </Box>
            <Box mb={3}>
              <Text fontSize="sm" mb={1}>Efeito</Text>
              <Select value={formData.Efeito} onChange={(e) => handleChange('Efeito', e.target.value)}>
                <option value="">Selecione</option>
                {efeitos.map((efeito) => (
                  <option key={efeito} value={efeito}>{efeito}</option>
                ))}
              </Select>
            </Box>
            <Box mb={3}>
                <Text fontSize="sm" mb={1}>Cor do Texto Animado</Text>
                <Input
                    type="color"
                    value={rgbToHex(formData.colorTextAnimado)}
                    onChange={(e) => handleChange('colorTextAnimado', hexToRgb(e.target.value))}
                />
                </Box>

          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSubmit}>{editFrase ? 'Atualizar' : 'Adicionar'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
